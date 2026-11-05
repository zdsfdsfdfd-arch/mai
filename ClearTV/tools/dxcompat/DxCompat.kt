/*
 * DxCompat — makes a JVM library jar processable by the legacy `dx` dexer.
 *
 * Modes:
 *   stub  <in.jar> <out.jar> <stubs.txt>  — copies the jar, dropping the META-INF/versions/ directory (multi-release
 *                                           class files newer than Java 8) and replacing the body of every
 *                                           method that contains an `invokedynamic` instruction with
 *                                           `throw new UnsupportedOperationException(...)`. Every replaced
 *                                           method is appended to stubs.txt as owner.name(desc).
 *   check <classesDir> <stubs.txt>        — fails (exit 2) if any class under classesDir calls one of the
 *                                           stubbed methods, so the application can never hit a stub.
 *
 * Uses the ASM copy shaded inside kotlin-compiler.jar (org.jetbrains.org.objectweb.asm), so it needs no
 * extra download. Written for the ClearTV SDK-less build path; see docs/build-without-sdk.md.
 */
import org.jetbrains.org.objectweb.asm.ClassReader
import org.jetbrains.org.objectweb.asm.ClassVisitor
import org.jetbrains.org.objectweb.asm.ClassWriter
import org.jetbrains.org.objectweb.asm.Handle
import org.jetbrains.org.objectweb.asm.MethodVisitor
import org.jetbrains.org.objectweb.asm.Opcodes
import org.jetbrains.org.objectweb.asm.Type
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

private const val API = Opcodes.ASM9

fun main(args: Array<String>) {
    when (args.getOrNull(0)) {
        "stub" -> stub(File(args[1]), File(args[2]), File(args[3]))
        "check" -> check(File(args[1]), File(args[2]))
        else -> { System.err.println("usage: DxCompat stub <in.jar> <out.jar> <stubs.txt> | check <classesDir> <stubs.txt>"); System.exit(1) }
    }
}

private fun indyMethods(bytes: ByteArray): Set<String> {
    val found = LinkedHashSet<String>()
    ClassReader(bytes).accept(object : ClassVisitor(API) {
        override fun visitMethod(access: Int, name: String, desc: String, sig: String?, ex: Array<out String>?): MethodVisitor =
            object : MethodVisitor(API) {
                override fun visitInvokeDynamicInsn(n: String?, d: String?, h: Handle?, vararg a: Any?) { found += name + desc }
            }
    }, ClassReader.SKIP_DEBUG or ClassReader.SKIP_FRAMES)
    return found
}

private fun stubClass(bytes: ByteArray, targets: Set<String>, log: (String) -> Unit): ByteArray {
    val cr = ClassReader(bytes)
    val cw = ClassWriter(0) // fresh constant pool: drops MethodHandle/InvokeDynamic constants dx cannot intern
    cr.accept(object : ClassVisitor(API, cw) {
        override fun visitMethod(access: Int, name: String, desc: String, sig: String?, ex: Array<out String>?): MethodVisitor? {
            val mv = super.visitMethod(access, name, desc, sig, ex)
            if (name + desc !in targets) return mv
            val isStatic = access and Opcodes.ACC_STATIC != 0
            val argSlots = (Type.getArgumentsAndReturnSizes(desc) shr 2) - (if (isStatic) 1 else 0)
            mv.visitCode()
            mv.visitTypeInsn(Opcodes.NEW, "java/lang/UnsupportedOperationException")
            mv.visitInsn(Opcodes.DUP)
            mv.visitLdcInsn("Removed by DxCompat (invokedynamic not supported by dx): ${cr.className}.$name")
            mv.visitMethodInsn(Opcodes.INVOKESPECIAL, "java/lang/UnsupportedOperationException", "<init>", "(Ljava/lang/String;)V", false)
            mv.visitInsn(Opcodes.ATHROW)
            mv.visitMaxs(3, maxOf(argSlots, 1))
            mv.visitEnd()
            log("${cr.className}.$name$desc")
            return null // original instructions are not replayed into the writer
        }
    }, 0)
    return cw.toByteArray()
}

private fun stub(input: File, output: File, stubsFile: File) {
    val stubs = ArrayList<String>()
    var dropped = 0; var classes = 0
    ZipInputStream(input.inputStream().buffered()).use { zin ->
        ZipOutputStream(output.outputStream().buffered()).use { zout ->
            while (true) {
                val e = zin.nextEntry ?: break
                val bytes = zin.readBytes()
                if (e.name.startsWith("META-INF/versions/")) { dropped++; continue }
                if (e.isDirectory) continue
                val data = if (e.name.endsWith(".class")) {
                    classes++
                    val targets = indyMethods(bytes)
                    if (targets.isEmpty()) bytes else stubClass(bytes, targets) { stubs += it }
                } else bytes
                zout.putNextEntry(ZipEntry(e.name)); zout.write(data); zout.closeEntry()
            }
        }
    }
    // A stub is just as fatal when the application reaches it indirectly. kotlin-stdlib multifile facades
    // *extend* their part classes (ComparisonsKt -> ComparisonsKt___ComparisonsKt -> ComparisonsKt__ComparisonsKt),
    // so the app calls ComparisonsKt.compareBy and the JVM resolves it to the stubbed part method; other methods
    // may simply delegate. Record both kinds as aliases so the check below refuses them — ClearTV 0.1.2/0.1.3
    // crashed on every start on a real TV through exactly this path while the check stayed green.
    val aliases = stubAliases(output, stubs.toSet())
    stubsFile.appendText((stubs + aliases).joinToString("") { it + "\n" })
    println("DxCompat: ${input.name}: $classes classes scanned, ${stubs.size} method(s) stubbed, ${aliases.size} inherited/delegating alias(es) recorded, $dropped multi-release entries dropped")
    stubs.forEach { println("  stub: $it") }
    aliases.forEach { println("  via:  $it") }
}

/**
 * Names under which a stubbed method can be reached: the same name+descriptor on every subclass of the owner
 * (inherited static/instance methods), plus methods whose body calls a stubbed or aliased method (delegation),
 * iterated to a fixpoint.
 */
private fun stubAliases(jar: File, stubbed: Set<String>): List<String> {
    val known = LinkedHashSet(stubbed)
    val found = ArrayList<String>()
    val classes = ArrayList<ByteArray>()
    val superOf = HashMap<String, String>()
    ZipInputStream(jar.inputStream().buffered()).use { zin ->
        while (true) {
            val e = zin.nextEntry ?: break
            val b = zin.readBytes()
            if (!e.name.endsWith(".class")) continue
            classes += b
            val cr = ClassReader(b)
            cr.superName?.let { superOf[cr.className] = it }
        }
    }
    // inherited: for every class, walk up the superclass chain; a stub declared on an ancestor is reachable here too
    for ((cls, _) in superOf) {
        var ancestor: String? = superOf[cls]
        while (ancestor != null) {
            for (entry in stubbed) {
                val dot = entry.indexOf('.')
                if (dot > 0 && entry.substring(0, dot) == ancestor) {
                    val alias = cls + entry.substring(dot)
                    if (known.add(alias)) found += alias
                }
            }
            ancestor = superOf[ancestor]
        }
    }
    // delegating: methods whose body calls anything known
    repeat(4) {
        var added = 0
        for (bytes in classes) {
            val cr = ClassReader(bytes)
            cr.accept(object : ClassVisitor(API) {
                override fun visitMethod(access: Int, name: String, desc: String, sig: String?, ex: Array<out String>?): MethodVisitor {
                    val self = "${cr.className}.$name$desc"
                    return object : MethodVisitor(API) {
                        override fun visitMethodInsn(op: Int, owner: String, mname: String, mdesc: String, itf: Boolean) {
                            if (self !in known && "$owner.$mname$mdesc" in known) { known += self; found += self; added++ }
                        }
                    }
                }
            }, ClassReader.SKIP_DEBUG or ClassReader.SKIP_FRAMES)
        }
        if (added == 0) return found
    }
    return found
}

private fun check(classesDir: File, stubsFile: File) {
    if (!stubsFile.exists()) { println("DxCompat: no stubs recorded, nothing to check"); return }
    val stubbed = stubsFile.readLines().filter { it.isNotBlank() }.toSet()
    val violations = ArrayList<String>()
    classesDir.walkTopDown().filter { it.isFile && it.extension == "class" }.forEach { f ->
        val bytes = f.readBytes()
        val cr = ClassReader(bytes)
        cr.accept(object : ClassVisitor(API) {
            override fun visitMethod(access: Int, name: String, desc: String, sig: String?, ex: Array<out String>?): MethodVisitor =
                object : MethodVisitor(API) {
                    override fun visitMethodInsn(op: Int, owner: String, mname: String, mdesc: String, itf: Boolean) {
                        if ("$owner.$mname$mdesc" in stubbed) violations += "${cr.className}.$name -> $owner.$mname$mdesc"
                    }
                    override fun visitInvokeDynamicInsn(n: String?, d: String?, h: Handle?, vararg a: Any?) {
                        violations += "${cr.className}.$name contains invokedynamic (compile with -Xlambdas=class -Xsam-conversions=class)"
                    }
                }
        }, ClassReader.SKIP_DEBUG or ClassReader.SKIP_FRAMES)
    }
    if (violations.isEmpty()) { println("DxCompat check: OK - application classes reference no stubbed methods and contain no invokedynamic") }
    else { violations.forEach { System.err.println("DxCompat check FAILED: $it") }; System.exit(2) }
}
