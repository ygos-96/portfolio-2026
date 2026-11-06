// Sistema de clima real e ciclo de iluminação

export const WEATHER_PRESETS = {
  day: {
    id: 'day',
    label: '☀️ Dia',
    sky: ['#4aa8f0', '#9bd8ff', '#e4f6ff'],
    fog: '#d6f0ff',
    hemi: { sky: '#eaf6ff', ground: '#8a86d8', intensity: 1.9 },
    sun: { color: '#fff0cc', intensity: 2.1, pos: [-16, 34, 14] },
    lampEmissive: 0.2,
    isRain: false,
    stars: false,
  },
  sunset: {
    id: 'sunset',
    label: '🌅 Pôr do Sol',
    sky: ['#662d5d', '#d94b38', '#ffc247'],
    fog: '#fca26e',
    hemi: { sky: '#ffd2a8', ground: '#4a2d59', intensity: 1.8 },
    sun: { color: '#ff7733', intensity: 2.4, pos: [-28, 18, 10] },
    lampEmissive: 1.1,
    isRain: false,
    stars: true,
  },
  night: {
    id: 'night',
    label: '🌙 Noite',
    sky: ['#060814', '#101530', '#1c2445'],
    fog: '#13192f',
    hemi: { sky: '#3a497d', ground: '#0d1124', intensity: 1.1 },
    sun: { color: '#8faeff', intensity: 1.2, pos: [-10, 32, -14] }, // luar azulado
    lampEmissive: 2.0,
    isRain: false,
    stars: true,
  },
  rain: {
    id: 'rain',
    label: '🌧️ Chuva',
    sky: ['#2e3745', '#4d596b', '#7a8799'],
    fog: '#596677',
    hemi: { sky: '#8a99a8', ground: '#333b47', intensity: 1.4 },
    sun: { color: '#9fb1c2', intensity: 1.1, pos: [-16, 34, 14] },
    lampEmissive: 1.3,
    isRain: true,
    stars: false,
  },
}

export function detectRealWeather(onResult) {
  const hour = new Date().getHours()
  let basePreset = 'day'
  if (hour >= 17 && hour < 19) basePreset = 'sunset'
  else if (hour >= 19 || hour < 6) basePreset = 'night'

  // Notifica imediatamente com base na hora local do dispositivo
  onResult(basePreset, false)

  // Consulta não-bloqueante de chuva real via API Open-Meteo (São Paulo ou geolocalizada)
  const fetchWeather = (lat, lon) => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day`)
      .then((res) => res.json())
      .then((data) => {
        const code = data?.current?.weather_code
        const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82]
        if (code !== undefined && rainCodes.includes(code)) {
          onResult('rain', true)
        } else {
          onResult(basePreset, true)
        }
      })
      .catch(() => {
        // Fallback silencioso mantendo o preset de horário local
      })
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(-23.55, -46.63), // São Paulo como padrão
      { timeout: 4000 },
    )
  } else {
    fetchWeather(-23.55, -46.63)
  }
}

