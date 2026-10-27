# story-pipeline — прототип автоматической сборки сюжетных роликов

Сценарий (JSON) → озвучка (TTS) → таймлайн → рендер Remotion → MP4 1080×1920.
Стиль: плоский вектор, тёмный фон, плашки, HUD, субтитры‑караоке, персонаж с рига из сегментов.

## Структура

```
episode/script.json      сценарий серии: сцены, текст озвучки с разметкой акцентов, плашки, позы
episode/timeline.json    результат tts.py: тайминги фраз и слов, кадры сцен (генерируется)
scripts/tts.py           озвучка по сценам (piper офлайн; заменить на ElevenLabs / SpeechKit)
scripts/stills.mjs       контрольные кадры по одному на сцену (быстрая проверка без полного рендера)
src/Episode.tsx          сборка серии из таймлайна: сцены, оверлеи, субтитры, аудио
src/scenes/*.tsx         библиотека типов сцен (title_card, building_cutaway, phone_screen,
                         stat_callouts, character_scene, cabin_diagram, sound_diagram, city_night, end_card)
src/components/          Character (риг), Captions (караоке), Overlays (плашки, HUD, водяной знак)
src/theme.ts             палитра и шрифты
public/fonts, public/audio  шрифты (самохостинг) и озвучка
```

## Разметка текста озвучки

- `*слово*` — слово сразу жёлтое в субтитрах
- `!несколько слов!` — красные
- Фразы делятся по `. ? … :`, каждая фраза появляется целиком, слова подсвечиваются в темпе речи.

## Запуск

```bash
npm install
# 1. озвучка + таймлайн (Node, движок по умолчанию edge = нейроголоса Microsoft, бесплатно)
npm run tts
# 2. фоновая музыка под длину серии и звуковые эффекты (вжухи, попы, удары, переходы)
npm run music && npm run sfx       # public/audio/music.wav, public/sfx/*.wav
# 3. контрольные кадры, по одному на сцену
npm run stills                     # out/stills/*.png
# 4. полный рендер
npm run render                     # out/episode.mp4
# всё сразу: npm run episode
# предпросмотр в браузере
npm run studio
```

### Движки озвучки (`scripts/tts.mjs`)

| ENGINE | Что нужно | Тайминги слов | Голоса |
|---|---|---|---|
| `edge` (по умолчанию) | интернет, ffmpeg | точные | `EDGE_VOICE=ru-RU-DmitryNeural` или `ru-RU-SvetlanaNeural`, темп `EDGE_RATE=+8%` |
| `elevenlabs` | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, ffmpeg | точные | любой голос ElevenLabs, модель `ELEVENLABS_MODEL` |
| `sapi` | Windows, ffmpeg | пропорциональные | `SAPI_VOICE="IVONA 2 Maxim OEM"` и другие голоса Windows |
| `files` | готовые записи в `episode/voice` (из веб-интерфейса ElevenLabs и т. п.), ffmpeg | по паузам между фразами | либо файл на сцену `s01.mp3 … s12.mp3`, либо один `all.mp3` с паузами ≥ 0,9 с между сценами |

`FFMPEG_BIN` задаёт путь к ffmpeg, если его нет в PATH. Пример для PowerShell:

```powershell
$env:ENGINE="edge"; $env:EDGE_VOICE="ru-RU-DmitryNeural"; $env:FFMPEG_BIN="C:\...\ffmpeg.exe"; npm run tts
```

Старая Python-версия `scripts/tts.py` (piper, офлайн) оставлена для окружений без интернета.
Переменная `REMOTION_BROWSER` задаёт путь к Chromium, если не нужно скачивать Chrome Headless Shell.

## Как это превращается в автоматический канал

1. **Сценарий.** LLM получает промпт с описанием библиотеки сцен (типы и их props) и отдаёт `script.json`.
   Второй проход LLM проверяет логику, темп и запрещённые темы.
2. **Озвучка.** `synth_phrase()` в `tts.py` меняется на вызов ElevenLabs (эндпоинт with‑timestamps даёт
   точные тайминги слов) или Yandex SpeechKit (тайминги через whisperX).
3. **Рендер.** Тот же `remotion render` на сервере или на ПК с GPU; 11‑минутная серия ≈ 20 000 кадров.
4. **Постинг.** Готовый MP4 уходит в сервис постинга (upload‑post, Postiz) или в TikTok / YouTube API.
5. **Новые типы сцен** добавляются одним React‑компонентом в `src/scenes` и строкой в `index.tsx`.
