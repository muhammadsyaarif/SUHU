'use client';
import supabase from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  async function fetchData() {
    let query = supabase.from("suhu").select("*").order("id", { ascending: false }).limit(10);

    if (startDate && endDate) {
      query = query.gte("created_at", startDate).lte("created_at", endDate);
    }

    const { data: fetchedData } = await query;
    setData(fetchedData ?? []);
  }

  function downloadPDF() {
    const doc = new jsPDF();
    doc.text("Data Suhu dan Kelembapan", 10, 10);

    const tableColumn = ["Waktu", "Suhu (°C)", "Kelembapan (%)"];
    const tableRows: any[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filteredData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= start && itemDate <= end;
    });

    if (filteredData.length === 0) {
      doc.text("No data available within the selected date range.", 10, 20);
    } else {
      filteredData.forEach(item => {
        const dataRow = [
          new Date(item.created_at).toLocaleString(),
          item.suhu,
          item.kelembapan,
        ];
        tableRows.push(dataRow);
      });

    }

    doc.save("data-suhu-kelembapan.pdf");
  }

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
      setCurrentTime(new Date().toLocaleTimeString());
    }, 5000);

    return () => clearInterval(intervalId);

  }, []);

  const latestData = data[0] || { suhu: "-", kelembapan: "-", created_at: "-" };

  const suhuChartData = {
    labels: data.map((item) => new Date(item.created_at).toLocaleTimeString()).concat(currentTime),
    datasets: [
      {
        label: 'Suhu (°C)',
        data: data.map((item) => item.suhu),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const kelembapanChartData = {
    labels: data.map((item) => new Date(item.created_at).toLocaleTimeString()).concat(currentTime),
    datasets: [
      {
        label: 'Kelembapan (%)',
        data: data.map((item) => item.kelembapan),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,  // Explicitly set to a valid type
      },
      title: {
        display: true,
        text: '',
      },
    },
  };

  return (
    <div className="bg-gradient-to-r from-blue-300 to-purple-300 min-h-screen">
      <div className="flex flex-col mx-10 my-10">
        {/* Section for filtering data */}
        <div className="flex flex-col md:flex-row justify-around items-center bg-white bg-opacity-90 border border-gray-200 rounded-lg shadow-lg mb-4 p-4">
          <div className="flex flex-col p-2">
            <label className="text-gray-700 font-semibold mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 p-2 rounded-md shadow-sm"
            />
          </div>
          <div className="flex flex-col p-2">
            <label className="text-gray-700 font-semibold mb-2">End Date</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 p-2 rounded-md shadow-sm"
            />
          </div>
          <div className="flex flex-row space-x-4 mt-4 md:mt-0">
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition duration-300"
            >
              Fetch Data
            </button>
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-green-700 transition duration-300"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Section for displaying latest data */}
        <div className="flex flex-col justify-center items-center p-12 bg-white bg-opacity-90 border border-gray-200 rounded-lg shadow-lg mb-4">
          <p className="text-4xl font-semibold uppercase tracking-widest text-gray-800 mb-4">
            Monitoring Suhu & Kelembapan
          </p>
          <div className="flex flex-col md:flex-row justify-around w-full">
            <div className="p-4 bg-blue-100 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-gray-700">Suhu: {latestData.suhu} °C</p>
              <p className="text-lg text-gray-500">Last updated: {latestData.created_at !== "-" ? new Date(latestData.created_at).toLocaleString() : "-"}</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-gray-700">Kelembapan: {latestData.kelembapan} %</p>
              <p className="text-lg text-gray-500">Last updated: {latestData.created_at !== "-" ? new Date(latestData.created_at).toLocaleString() : "-"}</p>
            </div>
          </div>
        </div>

        {/* Section for displaying charts side by side */}
        <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-8 m-8">
          {/* Temperature Chart */}
          <div className="w-full md:w-1/2 p-6 bg-white bg-opacity-90 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-2xl font-semibold text-gray-800 mb-4">Grafik Suhu</p>
            <Line data={suhuChartData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Grafik Suhu (°C)' } } }} />
          </div>

          {/* Humidity Chart */}
          <div className="w-full md:w-1/2 p-6 bg-white bg-opacity-90 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-2xl font-semibold text-gray-800 mb-4">Grafik Kelembapan</p>
            <Line data={kelembapanChartData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Grafik Kelembapan (%)' } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
