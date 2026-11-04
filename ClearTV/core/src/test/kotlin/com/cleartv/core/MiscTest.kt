package com.cleartv.core

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class MiscTest {
    @Test
    fun `string set codec round trip`() {
        val set = setOf("com.b", "com.a")
        assertEquals(set, StringSetCodec.decode(StringSetCodec.encode(set)))
        assertEquals(emptySet<String>(), StringSetCodec.decode(null))
    }

    @Test
    fun `clock mode patterns`() {
        assertEquals("HH:mm", ClockMode.SYSTEM.timePattern(systemIs24h = true))
        assertEquals("h:mm", ClockMode.SYSTEM.timePattern(systemIs24h = false))
        assertEquals("HH:mm", ClockMode.H24.timePattern(systemIs24h = false))
        assertEquals("h:mm", ClockMode.H12.timePattern(systemIs24h = true))
        assertEquals(ClockMode.H24, ClockMode.fromStorage("24h"))
        assertEquals(ClockMode.SYSTEM, ClockMode.fromStorage("garbage"))
        assertEquals(ClockMode.SYSTEM, ClockMode.H12.next())
    }

    @Test
    fun `crash loop detector trips on third crash inside window`() {
        val d = CrashLoopDetector(windowMs = 10_000, threshold = 3)
        val first = d.record(emptyList(), 1_000)
        assertFalse(first.loopDetected)
        val second = d.record(first.history, 2_000)
        assertFalse(second.loopDetected)
        val third = d.record(second.history, 3_000)
        assertTrue(third.loopDetected)
        assertEquals(3, third.history.size)
    }

    @Test
    fun `crash loop detector forgets old crashes`() {
        val d = CrashLoopDetector(windowMs = 10_000, threshold = 3)
        val decision = d.record(listOf(1_000, 2_000), 50_000)
        assertFalse(decision.loopDetected)
        assertEquals(listOf(50_000L), decision.history)
    }

    @Test
    fun `grid rows and neighbours`() {
        val items = (1..7).toList()
        val rows = Grid.rows(items, 3)
        assertEquals(3, rows.size)
        assertEquals(listOf(7), rows[2])
        assertEquals(3, Grid.neighbour(0, 3, 1, 7))
        assertEquals(6, Grid.neighbour(4, 3, 1, 7))   // row below is short: land on last item
        assertNull(Grid.neighbour(6, 3, 1, 7))
        assertEquals(1, Grid.neighbour(4, 3, -1, 7))
        assertNull(Grid.neighbour(1, 3, -1, 7))
    }

    @Test
    fun `centered scroll clamps to range`() {
        assertEquals(0, Scrolling.centeredScroll(0, 200, 1000, 3000))
        assertEquals(100, Scrolling.centeredScroll(500, 200, 1000, 3000))
        assertEquals(3000, Scrolling.centeredScroll(5000, 200, 1000, 3000))
        assertEquals(0, Scrolling.centeredScroll(5000, 200, 1000, -5))
    }
}
