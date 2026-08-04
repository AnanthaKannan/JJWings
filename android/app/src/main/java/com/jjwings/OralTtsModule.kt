package com.jjwings

import android.media.AudioAttributes
import android.os.Bundle
import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale

class OralTtsModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext),
  TextToSpeech.OnInitListener,
  LifecycleEventListener {

  private var textToSpeech: TextToSpeech? = null
  private var isReady = false
  private var pendingText: String? = null
  private var speechRate = 0.75f

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = "OralTts"

  @ReactMethod
  fun speak(text: String, rate: Double) {
    val cleanText = text.trim()
    if (cleanText.isEmpty()) return

    speechRate = rate.toFloat().coerceIn(0.4f, 1.5f)
    pendingText = cleanText

    if (textToSpeech == null) {
      textToSpeech = TextToSpeech(reactContext, this)
      return
    }

    if (isReady) {
      speakNow(cleanText)
    }
  }

  @ReactMethod
  fun stop() {
    pendingText = null
    textToSpeech?.stop()
  }

  override fun onInit(status: Int) {
    isReady = status == TextToSpeech.SUCCESS
    if (isReady) {
      applySpeechAudioAttributes()
      textToSpeech?.setSpeechRate(speechRate)
      val languageResult = textToSpeech?.setLanguage(Locale.getDefault())
      if (
        languageResult == TextToSpeech.LANG_MISSING_DATA ||
        languageResult == TextToSpeech.LANG_NOT_SUPPORTED
      ) {
        textToSpeech?.setLanguage(Locale.US)
      }
      pendingText?.let(::speakNow)
    }
  }

  override fun onHostResume() = Unit

  override fun onHostPause() {
    textToSpeech?.stop()
  }

  override fun onHostDestroy() {
    textToSpeech?.stop()
    textToSpeech?.shutdown()
    textToSpeech = null
    isReady = false
  }

  private fun speakNow(text: String) {
    pendingText = null
    applySpeechAudioAttributes()
    textToSpeech?.setSpeechRate(speechRate)
    val params = Bundle().apply {
      putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
    }
    textToSpeech?.stop()
    textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "oral-question")
  }

  private fun applySpeechAudioAttributes() {
    textToSpeech?.setAudioAttributes(
      AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .build(),
    )
  }
}
