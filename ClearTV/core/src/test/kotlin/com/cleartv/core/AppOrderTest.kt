package com.cleartv.core

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class AppOrderTest {
    @Test
    fun `merge keeps saved order and appends new apps`() {
        val saved = listOf("b", "a", "gone")
        val installed = listOf("a", "b", "c", "d")
        assertEquals(listOf("b", "a", "c", "d"), AppOrder.merge(saved, installed))
    }

    @Test
    fun `merge drops uninstalled and duplicates`() {
        assertEquals(listOf("a"), AppOrder.merge(listOf("a", "a", "x"), listOf("a")))
    }

    @Test
    fun `merge with empty saved order equals installed order`() {
        assertEquals(listOf("x", "y"), AppOrder.merge(emptyList(), listOf("x", "y")))
    }

    @Test
    fun `move shifts element to the right and left`() {
        val list = listOf("a", "b", "c", "d")
        assertEquals(listOf("b", "a", "c", "d"), AppOrder.move(list, 0, 1))
        assertEquals(listOf("a", "b", "d", "c"), AppOrder.move(list, 3, 2))
        assertEquals(listOf("b", "c", "d", "a"), AppOrder.move(list, 0, 3))
    }

    @Test
    fun `move ignores invalid indices`() {
        val list = listOf("a", "b")
        assertEquals(list, AppOrder.move(list, 0, 5))
        assertEquals(list, AppOrder.move(list, -1, 0))
        assertEquals(list, AppOrder.move(list, 1, 1))
    }

    @Test
    fun `encode and decode round trip`() {
        val list = listOf("com.a", "com.b", "com.c")
        assertEquals(list, AppOrder.decode(AppOrder.encode(list)))
        assertEquals(emptyList<String>(), AppOrder.decode(null))
        assertEquals(emptyList<String>(), AppOrder.decode(""))
        assertEquals(listOf("com.a"), AppOrder.decode("\ncom.a\n\n"))
    }
}

class AppOrderRetainTest {
    @Test
    fun `retain keeps order and drops missing or duplicate entries`() {
        assertEquals(listOf("b", "a"), AppOrder.retain(listOf("b", "gone", "a", "b"), setOf("a", "b", "c")))
        assertEquals(emptyList<String>(), AppOrder.retain(emptyList(), setOf("a")))
    }
}
