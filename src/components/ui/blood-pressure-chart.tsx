"use client";

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import dayjs from 'dayjs';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types
interface Measurement {
  id: string;
  date: Date | string;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string;
  userId?: string;
  classification?: string;
  color?: string;
}

interface BloodPressureChartProps {
  data?: Measurement[];
  measurements?: Measurement[];
  timeFrame?: 'week' | 'month' | 'all';
  height?: number;
}

export function BloodPressureChart({ data, measurements, timeFrame = 'all', height = 350 }: BloodPressureChartProps) {
  // Utiliser data ou measurements selon ce qui est fourni
  const chartMeasurements = useMemo(() => {
    return data || measurements || [];
  }, [data, measurements]);

  // Filtrer les mesures selon la période sélectionnée
  const filteredMeasurements = useMemo(() => {
    // Vérifier que chartMeasurements est un tableau valide
    if (!Array.isArray(chartMeasurements) || chartMeasurements.length === 0) {
      return [];
    }
    
    if (timeFrame === 'all' || !timeFrame) return chartMeasurements;

    const now = dayjs();
    let startDate: dayjs.Dayjs;

    if (timeFrame === 'week') {
      startDate = now.subtract(7, 'day');
    } else if (timeFrame === 'month') {
      startDate = now.subtract(30, 'day');
    } else {
      startDate = now.subtract(30, 'day'); // Défaut: 1 mois
    }

    return chartMeasurements.filter(m => {
      // Vérifier que m.date existe et est valide
      if (!m?.date) return false;
      try {
        const measureDate = dayjs(m.date);
        return measureDate.isValid() && measureDate.isAfter(startDate);
      } catch (error) {
        console.error("Erreur lors du filtrage des mesures:", error);
        return false;
      }
    });
  }, [chartMeasurements, timeFrame]);

  // Trier les mesures par date (ascendant)
  const sortedData = useMemo(() => {
    return [...filteredMeasurements].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredMeasurements]);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    const labels = sortedData.map(item => {
      const date = dayjs(item.date);
      return date.format('DD/MM HH:mm');
    });

    const sysData = sortedData.map(item => item.systolic);
    const diaData = sortedData.map(item => item.diastolic);
    const pulseData = sortedData.map(item => item.pulse);

    return {
      labels,
      datasets: [
        {
          label: 'Systolique',
          data: sysData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Diastolique',
          data: diaData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Pouls',
          data: pulseData,
          borderColor: 'rgb(5, 150, 105)',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: true, // Caché par défaut
        },
      ],
    };
  }, [sortedData]);

  // Configuration du graphique
  const options: ChartOptions<'line'> = useMemo(() => {
    // Calculate min value for y axis safely
    const systolicData = chartData.datasets[0].data as number[];
    const diastolicData = chartData.datasets[1].data as number[];
    const minSys = systolicData.length > 0 ? Math.min(...systolicData) : 0;
    const minDia = diastolicData.length > 0 ? Math.min(...diastolicData) : 0;
    const absoluteMin = Math.min(minSys, minDia);
    const yMin = Math.max(0, absoluteMin - 20);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;

              if (label === 'Systolique' || label === 'Diastolique') {
                return `${label}: ${value} mmHg`;
              }
              if (label === 'Pouls') {
                return `${label}: ${value} bpm`;
              }
              return `${label}: ${value}`;
            }
          }
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          min: yMin,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            callback: (value) => `${value}`
          },
        },
      },
    };
  }, [chartData]);

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg border border-dashed">
        <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
      </div>
    );
  }

  return (
    <div style={{ height: height ? `${height}px` : '350px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
