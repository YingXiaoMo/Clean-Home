<template>
  <div class="func-card glass-card">
    <div class="time-section">
      <div class="date">
        <span>{{ timeData.dateParams }}</span>
        <span class="weekday">{{ timeData.weekday }}</span>
      </div>
      <div class="clock">{{ timeData.time }}</div>
    </div>
    
    <div class="weather-section">
      <span v-if="loading" class="loading-text">正在获取天气...</span>
      <div v-else class="weather-info">
        <span class="item">{{ weatherData.city }}</span>
        <span class="item">{{ weatherData.weather }}</span>
        <span class="item">{{ weatherData.temperature }}℃</span>
        <span class="item">{{ weatherData.wind }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTime } from '@/composables/useTime';
import { useWeather } from '@/composables/useWeather';

const { timeData } = useTime();
const { weatherData, loading } = useWeather();
</script>

<style scoped lang="scss">
.glass-card {
  padding: 20px 25px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 160px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s;
  box-sizing: border-box;

  &:hover { transform: scale(1.01); }
  
  .time-section {
    text-align: center;
    
    .date {
      font-size: 0.95rem;
      opacity: 0.85;
      .weekday { margin-left: 10px; }
    }
    
    .clock {
      font-size: 3.5rem;
      font-family: "UnidreamLED", sans-serif;
      letter-spacing: 2px;
      margin: 5px 0;
      text-shadow: 0 0 10px rgba(255,255,255,0.5);
      line-height: 1;
    }
  }

  .weather-section {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .loading-text {
      font-size: 0.9rem;
      opacity: 0.7;
    }

    .weather-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px; 
      
    
      white-space: nowrap; 
      overflow: hidden; 
      text-overflow: ellipsis;
      width: 100%;
      
      .item {
        font-size: 1rem;
        opacity: 0.9;
      }
    }
  }
}


@media (max-width: 720px) {
  .glass-card .time-section .clock { font-size: 3rem; }
  .glass-card .weather-section .weather-info .item {
    font-size: 0.9rem; 
    gap: 6px;
  }
}
</style>