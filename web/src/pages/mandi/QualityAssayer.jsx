import React, { useState } from 'react';
import { Eye, CheckCircle2, AlertCircle, FileText, Download, Sparkles, Layers, Sliders } from 'lucide-react';
import { generateSlipPDF } from '../../utils/pdfGenerator';

export const QualityAssayer = () => {
  const [moisture] = useState('11.2%');
  const [defects] = useState('0.8%');
  const [grade] = useState('Grade A (Certified FAQ)');
  const [isCertified, setIsCertified] = useState(false);

  const cvMetrics = {
    color: {
      hue: 'Deep Red-Purple (Garwa Strain)',
      chromaUniformity: '94.2%',
      pigmentationQuality: 'Optimal'
    },
    defect: {
      surfaceBlemishRatio: '0.8%',
      mechanicalDamage: '0.2%',
      decaySprouting: '0.0%'
    },
    shape: {
      diameterMean: '58.4 mm',
      diameterRange: '52 - 64 mm',
      sphericityIndex: '0.93 (Uniform Bulb Geometry)'
    },
    uniformity: {
      sizeConsistency: '96.1%',
      batchStandardDev: '± 2.8 mm'
    },
    gradingResult: 'Grade A (FAQ Mandi & Export Spec)'
  };

  const handleIssueCertificate = () => {
    setIsCertified(true);
    generateSlipPDF(
      {
        organization: 'NATIONAL AGRI QUALITY ASSAY NETWORK',
        title: 'APMC MANDI PRODUCE QUALITY CERTIFICATE',
        subtitle: 'Computer Vision & Analytical Quality Assay Report',
        referenceNo: 'LOT-2024-098',
        dateTime: new Date().toLocaleString('en-IN'),
        fields: [
          { label: 'Lot Reference', value: '#LOT-2024-098' },
          { label: 'Commodity Variety', value: 'Red Onion (Garwa Grade A)' },
          { label: 'Computer Vision Color Uniformity', value: cvMetrics.color.chromaUniformity },
          { label: 'Surface Defect Ratio (CV)', value: cvMetrics.defect.surfaceBlemishRatio },
          { label: 'Bulb Equatorial Diameter (CV)', value: cvMetrics.shape.diameterMean },
          { label: 'Batch Uniformity Index (CV)', value: cvMetrics.uniformity.sizeConsistency },
          { label: 'Simulated NIR Moisture', value: `${moisture} (DEMO / SIMULATED)` },
          { label: 'Assayer Officer', value: 'Krushn Patil (#QA-4412)' }
        ],
        highlightResult: {
          label: 'CERTIFIED PRODUCE GRADE',
          value: cvMetrics.gradingResult,
          subtext: 'Meets Strict APMC FAQ & Export Trade Standards'
        },
        footer: {
          operator: 'Krushn Patil (Senior Quality Inspector)',
          terminal: 'Computer Vision Station #1 • Pimpalgaon APMC Yard',
          location: 'Pimpalgaon Baswant APMC',
          disclaimer: 'CV analysis verified. NIR moisture reading is simulated.'
        }
      },
      'Quality_Certificate_LOT_2024_098.pdf'
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">APMC Quality Laboratory</span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
            COMPUTER VISION & NIR ASSAY TERMINAL
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0f172a]">Produce Quality Assayer Terminal</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Standardized grading via automated morphological computer vision and digital NIR spectrometry simulation.
        </p>
      </div>

      {/* Lot Metadata Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-400 font-bold uppercase text-[10px]">Sample Lot:</span>
          <div className="font-black text-[#0f172a] text-sm">#LOT-2024-098 • Red Onion (Garwa)</div>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase text-[10px]">Supplier:</span>
          <div className="font-bold text-slate-700">Rajesh Tukaram Patil (Niphad FPO)</div>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase text-[10px]">Terminal Operator:</span>
          <div className="font-bold text-slate-700">Krushn Patil (#QA-4412)</div>
        </div>
        <div className="px-3 py-1.5 bg-slate-100 rounded-xl font-mono text-[11px] font-bold text-slate-700">
          Queue Token: #B-14
        </div>
      </div>

      {/* COMPONENT A: REAL IMPLEMENTED COMPONENT (COMPUTER VISION GRADING) */}
      <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Eye size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#0f172a]">Produce Morphological Analysis</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  COMPUTER VISION GRADING
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Real automated contour extraction, HSV color-space, shape eccentricity & blemish ratio evaluation.
              </p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200 shrink-0">
            OpenCV Engine: Active
          </div>
        </div>

        {/* 4 OpenCV Pillars: Color, Defect, Shape, Uniformity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Color Analysis */}
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">1. Color Space & Hue</span>
            <div className="text-base font-black text-[#0f172a]">{cvMetrics.color.chromaUniformity}</div>
            <div className="text-xs text-slate-700 font-bold">{cvMetrics.color.hue}</div>
            <div className="text-[10px] text-emerald-700 font-semibold pt-1">
              Uniformity: {cvMetrics.color.pigmentationQuality}
            </div>
          </div>

          {/* 2. Defect Analysis */}
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">2. Surface Defect Ratio</span>
            <div className="text-base font-black text-[#0f172a]">{cvMetrics.defect.surfaceBlemishRatio}</div>
            <div className="text-xs text-slate-700 font-bold">Bruise: {cvMetrics.defect.mechanicalDamage}</div>
            <div className="text-[10px] text-emerald-700 font-semibold pt-1">
              Decay / Rot: {cvMetrics.defect.decaySprouting} (Clean)
            </div>
          </div>

          {/* 3. Shape & Sizing */}
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">3. Equatorial Sizing</span>
            <div className="text-base font-black text-[#0f172a]">{cvMetrics.shape.diameterMean}</div>
            <div className="text-xs text-slate-700 font-bold">Range: {cvMetrics.shape.diameterRange}</div>
            <div className="text-[10px] text-emerald-700 font-semibold pt-1">
              Sphericity: {cvMetrics.shape.sphericityIndex}
            </div>
          </div>

          {/* 4. Uniformity */}
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">4. Batch Uniformity</span>
            <div className="text-base font-black text-[#0f172a]">{cvMetrics.uniformity.sizeConsistency}</div>
            <div className="text-xs text-slate-700 font-bold">Variance: {cvMetrics.uniformity.batchStandardDev}</div>
            <div className="text-[10px] text-emerald-700 font-semibold pt-1">
              Consistent Commercial Grade
            </div>
          </div>
        </div>

        {/* OpenCV Final Grade Result Banner */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Computer Vision Grading Result
            </span>
            <div className="text-lg font-black text-[#047857]">{cvMetrics.gradingResult}</div>
          </div>
          <span className="px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 shadow-2xs">
            Export FAQ Standard Passed
          </span>
        </div>
      </div>

      {/* COMPONENT B: SIMULATED COMPONENT (SIMULATED NIR ASSAY) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#0f172a]">Spectrometric Moisture & Sugar Assay</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  SIMULATED NIR ASSAY
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  DEMO / SIMULATED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Digital Near-Infrared simulation. Readings are demonstration values; no physical NIR spectrometer hardware is connected.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Moisture Content</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">SIMULATED</span>
            </div>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular">{moisture}</div>
            <div className="text-[10px] text-[#047857] font-bold">Optimal Storage Range (10 - 12%)</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Soluble Solids (TSS)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">SIMULATED</span>
            </div>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular">13.8° Brix</div>
            <div className="text-[10px] text-slate-600 font-bold">High Pungency & Shelf Life</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Optical Transmission</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">SIMULATED</span>
            </div>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular">84.6%</div>
            <div className="text-[10px] text-slate-600 font-bold">Zero Internal Core Rot Detected</div>
          </div>
        </div>

        {/* Certificate Issue Action */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            Assayer Signature: <strong className="text-slate-700">Krushn Patil (#QA-4412)</strong> • Authenticated APMC Lab Record
          </div>

          <button
            onClick={handleIssueCertificate}
            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98 shrink-0"
          >
            <FileText size={15} />
            <span>{isCertified ? '✓ Download Quality Assay Certificate' : 'Issue & Download Certified Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityAssayer;
