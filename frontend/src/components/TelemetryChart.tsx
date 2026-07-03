import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Box, Typography } from '@mui/material';

interface TelemetryChartProps {
  title: string;
  value: number;
  unit: string;
  color?: string;
  maxBuffer?: number;
  min?: number;
  max?: number;
}

export function TelemetryChart({ 
  title, 
  value, 
  unit, 
  color = '#3B82F6', 
  maxBuffer = 60, // 15 seconds at 4Hz
  min,
  max
}: TelemetryChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const dataBuffer = useRef<{ name: string; value: [number, number] }[]>([]);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);
    
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: any) => {
            const val = params[0].value[1].toFixed(2);
            return `${val} ${unit}`;
        }
      },
      grid: {
        top: 10,
        bottom: 20,
        left: 40,
        right: 10,
      },
      xAxis: {
        type: 'time',
        splitLine: { show: false },
        axisLabel: { show: false }, // Hide time labels for clean HMI look
        axisLine: { lineStyle: { color: '#252C36' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: min,
        max: max,
        splitLine: { lineStyle: { color: '#252C36', type: 'dashed' } },
        axisLabel: { color: '#9CA3AF', fontSize: 10 },
      },
      series: [
        {
          name: title,
          type: 'line',
          showSymbol: false,
          data: dataBuffer.current,
          itemStyle: { color: color },
          lineStyle: { width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}00` }
            ])
          },
          animation: false // Disable animation for streaming performance
        }
      ]
    };
    
    chartInstance.current.setOption(option);
    
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [title, unit, color, min, max]);

  useEffect(() => {
    if (!chartInstance.current) return;

    const now = Date.now();
    dataBuffer.current.push({
      name: now.toString(),
      value: [now, value]
    });

    if (dataBuffer.current.length > maxBuffer) {
      dataBuffer.current.shift();
    }

    chartInstance.current.setOption({
      series: [{ data: dataBuffer.current }]
    });
  }, [value, maxBuffer]);

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color }}>
          {value.toFixed(2)} <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{unit}</span>
        </Typography>
      </Box>
      <Box ref={chartRef} sx={{ width: '100%', height: 'calc(100% - 30px)' }} />
    </Box>
  );
}
