import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip } from 'recharts';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const initialAcquiringDetail = [
  { name: 'Q1', volume: 36.7, serviceFee: 117.0, costToVol: 1.7, interchange: 1.7 },
  { name: 'Q2', volume: 41.5, serviceFee: 122.2, costToVol: 1.9, interchange: 1.9 },
  { name: 'Q3', volume: 48.2, serviceFee: 113.3, costToVol: 1.7, interchange: 1.7 },
  { name: 'Q4', volume: 53.3, serviceFee: 107.8, costToVol: 1.7, interchange: 1.7 },
  { name: 'Q5', volume: 49.0, serviceFee: 115.5, costToVol: 1.5, interchange: 1.5 },
  { name: 'Q6', volume: 55.1, serviceFee: 120.2, costToVol: 1.8, interchange: 1.8 },
];

const ChartLegend = ({ color, label, isBar }) => (
  <div className="flex flex-col items-center justify-end gap-1.5 cursor-default">
    {isBar ? <div className="w-8 h-3 mt-0.5 rounded-sm" style={{ backgroundColor: color }}></div> : <div className="flex items-center justify-center w-10 h-5 relative"><div className="absolute w-full h-[2px]" style={{ backgroundColor: color }}></div><div className="absolute w-2 h-2 rounded-full ring-2 ring-white" style={{ backgroundColor: color }}></div></div>}
    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
  </div>
);

export default function AcquiringDetail({ onBack }) {
  return (
    <div className="flex-1 ml-[88px] p-8 overflow-y-auto h-full scroll-smooth">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Detail Transaksi - ACQUIRING</h1>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
          <h3 className="font-bold text-xl italic text-gray-900">ACQUIRING TREND Q1-Q6</h3>
        </div>

        <div className="flex justify-around items-end mb-6 px-1 min-h-[40px]">
          <ChartLegend color="#3b82f6" label="Service fee" />
          <ChartLegend color="#eab308" label="Interchange" />
          <ChartLegend color="#cbd5e1" label="Cost To Vol" />
          <ChartLegend color="#3b82f6" label="Volume" isBar={true} />
        </div>

        <div className="h-80 w-full text-xs font-semibold">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={initialAcquiringDetail} margin={{ top: 25, right: 15, left: 15, bottom: 0 }}>
              <Tooltip />
              
              {/* LOGIKA SPASI ANTI-TABRAKAN ACQUIRING: Interchange ditarik ke atas (multiplier diperkecil jadi 1.7) */}
              <YAxis yAxisId="vol" hide={true} domain={[0, dataMax => Math.max(dataMax * 7.0, 10)]} /> 
              <YAxis yAxisId="ctv" hide={true} domain={[0, dataMax => Math.max(dataMax * 3.5, 5)]} />
              <YAxis yAxisId="int" hide={true} domain={[0, dataMax => Math.max(dataMax * 1.7, 5)]} /> 
              <YAxis yAxisId="sf"  hide={true} domain={[0, dataMax => Math.max(dataMax * 1.2, 100)]} /> 

              <XAxis dataKey="name" axisLine={{ stroke: '#e2e8f0', strokeWidth: 1.5 }} tickLine={false} tick={{ dy: 10, fill: '#64748b', fontSize: 11 }} />
              
              <Bar yAxisId="vol" dataKey="volume" fill="#38bdf8" barSize={40} radius={[3, 3, 0, 0]}>
                <LabelList dataKey="volume" position="insideBottom" fill="#ffffff" formatter={(val) => `${val} T`} offset={10} fontSize={11} />
              </Bar>
              <Line yAxisId="ctv" type="linear" dataKey="costToVol" stroke="#cbd5e1" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 2 }}>
                <LabelList dataKey="costToVol" position="top" fill="#64748b" formatter={(val) => `${val}%`} offset={10} fontSize={11} />
              </Line>
              <Line yAxisId="int" type="linear" dataKey="interchange" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#eab308', strokeWidth: 2 }}>
                <LabelList dataKey="interchange" position="top" fill="#a16207" formatter={(val) => `${val}%`} offset={10} fontSize={11} />
              </Line>
              <Line yAxisId="sf" type="linear" dataKey="serviceFee" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4.5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 2 }}>
                <LabelList dataKey="serviceFee" position="top" fill="#1e293b" formatter={(val) => `${val} M`} offset={10} fontSize={11} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}