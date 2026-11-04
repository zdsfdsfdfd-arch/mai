package com.cleartv.launcher.data

import android.util.Base64
import java.io.ByteArrayOutputStream
import java.io.Closeable
import java.io.DataInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.OutputStream
import java.math.BigInteger
import java.net.InetSocketAddress
import java.net.Socket
import java.net.SocketTimeoutException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.security.GeneralSecurityException
import java.security.KeyFactory
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.PublicKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher

/**
 * Minimal ADB client that talks to the TV's own adbd (127.0.0.1:5555, open while network debugging is on).
 * It lets ClearTV put itself back as the HOME application after the firmware resets that choice at boot,
 * something an ordinary app cannot do through public APIs. The first connection makes the TV ask
 * "Allow USB debugging?"; the user accepts with "Always allow". Only [HomeKeeper] uses it, with fixed commands.
 *
 * Kotlin port of `Adb.java` from the MIT-licensed "Sber TV AT30A6 debloat project"
 * (https://github.com/kryzhukov/sber-tv-at30a6-free-my-tv, (c) 2026 its contributors); see docs/THIRD-PARTY.md.
 * Protocol: https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/protocol.txt
 */
class AdbClient private constructor(private val socket: Socket) : Closeable {

    class AdbException(message: String, val kind: Kind) : IOException(message) {
        enum class Kind { PORT_CLOSED, NO_RESPONSE, NOT_APPROVED, REJECTED, TLS_REQUIRED, PROTOCOL }
    }

    private class Message(val command: Int, val arg0: Int, val arg1: Int, val data: ByteArray)

    private val input = DataInputStream(socket.getInputStream())
    private val output: OutputStream = socket.getOutputStream()
    private var nextLocalId = 1

    /** Runs a command in the TV's shell and returns its output (stdout and stderr together). */
    fun shell(command: String): String {
        val local = nextLocalId++
        send(OPEN, local, 0, ("shell:$command\u0000").toByteArray(Charsets.UTF_8))
        var remote = 0
        val result = ByteArrayOutputStream()
        while (true) {
            val m = read()
            if (m.arg1 != local) continue
            when (m.command) {
                OKAY -> remote = m.arg0
                WRTE -> { result.write(m.data); send(OKAY, local, m.arg0, null) }
                CLSE -> {
                    if (remote == 0 && m.arg0 == 0) throw AdbException("ADB refused the command", AdbException.Kind.PROTOCOL)
                    send(CLSE, local, m.arg0, null)
                    return result.toString("UTF-8")
                }
            }
        }
    }

    override fun close() {
        try { socket.close() } catch (_: IOException) {}
    }

    private fun read(): Message {
        val header = ByteArray(24)
        input.readFully(header)
        val b = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN)
        val command = b.int
        val arg0 = b.int
        val arg1 = b.int
        val length = b.int
        b.int // checksum: newer adbd does not verify it
        val magic = b.int
        if ((command xor -1) != magic) throw AdbException("invalid ADB message", AdbException.Kind.PROTOCOL)
        if (length < 0 || length > 1024 * 1024) throw AdbException("ADB message too large", AdbException.Kind.PROTOCOL)
        val data = ByteArray(length)
        input.readFully(data)
        return Message(command, arg0, arg1, data)
    }

    private fun send(command: Int, arg0: Int, arg1: Int, data: ByteArray?) {
        val length = data?.size ?: 0
        var sum = 0
        if (data != null) for (x in data) sum += x.toInt() and 0xff
        val b = ByteBuffer.allocate(24 + length).order(ByteOrder.LITTLE_ENDIAN)
        b.putInt(command).putInt(arg0).putInt(arg1).putInt(length).putInt(sum).putInt(command xor -1)
        if (data != null) b.put(data)
        output.write(b.array())
        output.flush()
    }

    companion object {
        private const val CNXN = 0x4e584e43
        private const val AUTH = 0x48545541
        private const val OPEN = 0x4e45504f
        private const val OKAY = 0x59414b4f
        private const val CLSE = 0x45534c43
        private const val WRTE = 0x45545257
        private const val STLS = 0x534c5453
        private const val VERSION = 0x01000001
        private const val MAX_DATA = 256 * 1024
        private const val AUTH_TOKEN = 1
        private const val AUTH_SIGNATURE = 2
        private const val AUTH_RSAPUBLICKEY = 3
        const val KEY_NAME = "cleartv@tv"

        /** Start of the PKCS#1 block of a SHA-1 signature (adbd treats the 20-byte token as the digest). */
        private val SHA1_PREFIX = byteArrayOf(0x30, 0x21, 0x30, 0x09, 0x06, 0x05, 0x2b, 0x0e, 0x03, 0x02, 0x1a, 0x05, 0x00, 0x04, 0x14)

        /**
         * Connects to adbd and authenticates with the key stored in [keyDir]. When the TV does not know the key
         * yet, the public key is offered and the method waits up to [approvalMs] for the user to accept the prompt.
         */
        @Throws(IOException::class)
        fun connect(keyDir: File, host: String = "127.0.0.1", port: Int = 5555, approvalMs: Int = 30_000, onWaitingForApproval: (() -> Unit)? = null): AdbClient {
            val keys = keys(keyDir)
            val s = Socket()
            try {
                s.connect(InetSocketAddress(host, port), 3000)
            } catch (e: IOException) {
                s.close()
                throw AdbException("debugging is off on the TV (port $port closed)", AdbException.Kind.PORT_CLOSED)
            }
            val adb: AdbClient
            try {
                s.soTimeout = 10_000
                adb = AdbClient(s)
            } catch (e: Exception) {
                s.close(); throw e
            }
            try {
                adb.send(CNXN, VERSION, MAX_DATA, "host::\u0000".toByteArray(Charsets.US_ASCII))
                var signed = false
                var offeredKey = false
                while (true) {
                    val m = try { adb.read() } catch (e: SocketTimeoutException) {
                        throw if (offeredKey) AdbException("debugging permission was not accepted on the TV", AdbException.Kind.NOT_APPROVED)
                        else AdbException("the TV's ADB did not respond", AdbException.Kind.NO_RESPONSE)
                    }
                    when {
                        m.command == CNXN -> { s.soTimeout = 20_000; return adb }
                        m.command == STLS -> throw AdbException("the TV requires TLS (wireless debugging); enable classic network debugging", AdbException.Kind.TLS_REQUIRED)
                        m.command != AUTH || m.arg0 != AUTH_TOKEN -> throw AdbException("unexpected reply from ADB", AdbException.Kind.PROTOCOL)
                        !signed -> { adb.send(AUTH, AUTH_SIGNATURE, 0, sign(keys.private, m.data)); signed = true }
                        !offeredKey -> {
                            adb.send(AUTH, AUTH_RSAPUBLICKEY, 0, publicKeyBlob(keys.public))
                            offeredKey = true
                            onWaitingForApproval?.invoke()
                            s.soTimeout = approvalMs
                        }
                        else -> throw AdbException("the TV rejected the app's key", AdbException.Kind.REJECTED)
                    }
                }
            } catch (e: Exception) {
                adb.close(); throw e
            }
        }

        @Synchronized
        internal fun keys(dir: File): KeyPair {
            val privateFile = File(dir, "adbkey")
            val publicFile = File(dir, "adbkey.pub")
            try {
                val factory = KeyFactory.getInstance("RSA")
                if (privateFile.exists() && publicFile.exists()) {
                    try {
                        return KeyPair(
                            factory.generatePublic(X509EncodedKeySpec(publicFile.readBytes())),
                            factory.generatePrivate(PKCS8EncodedKeySpec(privateFile.readBytes())),
                        )
                    } catch (_: Exception) {
                        // corrupted (power loss mid-write): generate a new key, the TV will ask again
                    }
                }
                val generator = KeyPairGenerator.getInstance("RSA")
                generator.initialize(2048)
                val pair = generator.generateKeyPair()
                writeAtomic(privateFile, pair.private.encoded)
                writeAtomic(publicFile, pair.public.encoded)
                return pair
            } catch (e: GeneralSecurityException) {
                throw IOException("ADB key: " + e.message)
            }
        }

        internal fun sign(key: PrivateKey, token: ByteArray): ByteArray {
            try {
                val block = ByteArray(256)
                block[1] = 1
                val separator = block.size - SHA1_PREFIX.size - token.size - 1
                for (i in 2 until separator) block[i] = 0xff.toByte()
                System.arraycopy(SHA1_PREFIX, 0, block, separator + 1, SHA1_PREFIX.size)
                System.arraycopy(token, 0, block, separator + 1 + SHA1_PREFIX.size, token.size)
                val cipher = Cipher.getInstance("RSA/ECB/NoPadding")
                cipher.init(Cipher.ENCRYPT_MODE, key)
                return cipher.doFinal(block)
            } catch (e: GeneralSecurityException) {
                throw IOException("ADB signature: " + e.message)
            }
        }

        /** Public key in adbd's format: the RSAPublicKey struct in base64 plus a name. */
        internal fun publicKeyBlob(key: PublicKey): ByteArray {
            val rsa = key as RSAPublicKey
            val n = rsa.modulus
            val r32 = BigInteger.ONE.shiftLeft(32)
            val n0inv = r32.subtract(n.mod(r32).modInverse(r32))
            val rr = BigInteger.ONE.shiftLeft(4096).mod(n)
            val b = ByteBuffer.allocate(524).order(ByteOrder.LITTLE_ENDIAN)
            b.putInt(64)
            b.putInt(n0inv.toInt())
            b.put(littleEndian(n, 256))
            b.put(littleEndian(rr, 256))
            b.putInt(rsa.publicExponent.toInt())
            val text = Base64.encodeToString(b.array(), Base64.NO_WRAP) + " " + KEY_NAME + "\u0000"
            return text.toByteArray(Charsets.US_ASCII)
        }

        private fun littleEndian(value: BigInteger, size: Int): ByteArray {
            val big = value.toByteArray()
            val little = ByteArray(size)
            var i = 0
            while (i < size && i < big.size) { little[i] = big[big.size - 1 - i]; i++ }
            return little
        }

        private fun writeAtomic(f: File, data: ByteArray) {
            val tmp = File(f.path + ".tmp")
            FileOutputStream(tmp).use { out -> out.write(data); out.fd.sync() }
            if (!tmp.renameTo(f)) throw IOException("could not save " + f.name)
        }
    }
}
