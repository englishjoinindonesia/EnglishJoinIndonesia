import React, { useState } from 'react';
import { 
  Settings2, Save, CheckCircle2, Layers, Sliders
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { CustomDropdown } from '../common/CustomDropdown';

export const ScoreSettingsTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr } = useLanguage();
  const [minPassingScore, setMinPassingScore] = useState<number>(500);
  const [lpdpTargetScore, setLpdpTargetScore] = useState<number>(550);
  const [cpnsTargetScore, setCpnsTargetScore] = useState<number>(450);
  const [validityPeriodYears, setValidityPeriodYears] = useState<number>(2);
  const [isSaved, setIsSaved] = useState(false);

  // Conversion samples
  const conversionSamples = [
    { raw: '50 (Max)', listening: '68', structure: '68', reading: '67', totalScaled: '677' },
    { raw: '45', listening: '62', structure: '63', reading: '60', totalScaled: '617' },
    { raw: '40', listening: '57', structure: '58', reading: '55', totalScaled: '567' },
    { raw: '35', listening: '52', structure: '54', reading: '51', totalScaled: '523' },
    { raw: '30', listening: '48', structure: '49', reading: '46', totalScaled: '477' },
    { raw: '20', listening: '38', structure: '40', reading: '37', totalScaled: '383' },
    { raw: '10', listening: '32', structure: '31', reading: '31', totalScaled: '313' },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const cardBg = isDark 
    ? 'bg-[#141414] border-white/10 text-white shadow-sm' 
    : 'bg-white border-slate-200/90 text-slate-900 shadow-xs';
  const innerCardBg = isDark
    ? 'bg-[#0f0f10] border-white/5'
    : 'bg-slate-50/80 border-slate-200/80';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-2 sm:space-y-2.5">
      
      {/* Top Header */}
      <div className={`p-2 sm:px-3 sm:py-2 rounded-xl border ${cardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F7B425]/15 flex items-center justify-center text-[#F7B425] font-bold shrink-0">
            <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h2 className={`text-[16px] font-bold font-['Poppins',sans-serif] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {tr('Pengaturan Score Test TOEFL ITP', 'TOEFL ITP Test Score Settings')}
            </h2>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-2.5 py-1 bg-[#F7B425] hover:bg-amber-400 text-black rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
        >
          <Save className="w-3 h-3" />
          <span className="text-[12px] font-bold">{isSaved ? tr('Pengaturan Disimpan!', 'Settings Saved!') : tr('Simpan Pengaturan', 'Save Settings')}</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-2 px-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{tr('Pengaturan bobot skor TOEFL berhasil diperbarui di seluruh sistem evaluasi!', 'TOEFL score weight settings successfully updated across evaluation system!')}</span>
        </div>
      )}

      {/* Main Grid: Parameters & Formula */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 items-start">
        
        {/* Left: Configuration Form (lg:col-span-6) */}
        <div className={`lg:col-span-6 rounded-xl p-2.5 sm:p-3 border ${cardBg} space-y-2 transition-colors`}>
          <div className="flex items-center gap-1.5 pb-2 border-b border-white/10 dark:border-white/10 border-slate-200">
            <Sliders className="w-3.5 h-3.5 text-[#F7B425]" />
            <h3 className={`text-xs sm:text-sm font-bold font-['Poppins',sans-serif] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {tr('Standar Nilai Kelulusan (Passing Grade)', 'Passing Grade Standards')}
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            
            {/* Standard Passing Grade */}
            <div className={`p-2 sm:p-2.5 rounded-lg border ${innerCardBg} space-y-1`}>
              <div className="flex justify-between items-center">
                <label className={`font-bold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {tr('Standar Kelulusan English Join (Garansi)', 'English Join Passing Grade (Guaranteed)')}
                </label>
                <span className="font-mono font-black text-xs text-black bg-[#F7B425] px-1.5 py-0.2 rounded shadow-xs">
                  {minPassingScore}
                </span>
              </div>
              <p className={`text-[10px] leading-tight ${subText}`}>
                {tr(
                  'Siswa yang mencapai skor ini akan menerima predikat "Passed / Proficient" di E-Certificate.',
                  'Students who achieve this score will receive "Passed / Proficient" on their E-Certificate.'
                )}
              </p>
              <input
                type="range"
                min={400}
                max={600}
                step={5}
                value={minPassingScore}
                onChange={(e) => setMinPassingScore(Number(e.target.value))}
                className="w-full h-1.5 accent-[#F7B425] cursor-pointer"
              />
            </div>

            {/* LPDP & Scholarship Grade */}
            <div className={`p-2 sm:p-2.5 rounded-lg border ${innerCardBg} space-y-1`}>
              <div className="flex justify-between items-center">
                <label className={`font-bold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {tr('Target Beasiswa LPDP / AAS / Luar Negeri', 'LPDP / AAS / Overseas Scholarship Target')}
                </label>
                <span className="font-mono font-black text-xs text-[#F7B425] bg-[#F7B425]/15 border border-[#F7B425]/30 px-1.5 py-0.2 rounded">
                  {lpdpTargetScore}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={650}
                step={5}
                value={lpdpTargetScore}
                onChange={(e) => setLpdpTargetScore(Number(e.target.value))}
                className="w-full h-1.5 accent-[#F7B425] cursor-pointer"
              />
            </div>

            {/* CPNS & BUMN */}
            <div className={`p-2 sm:p-2.5 rounded-lg border ${innerCardBg} space-y-1`}>
              <div className="flex justify-between items-center">
                <label className={`font-bold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {tr('Syarat Minimum CPNS & Rekrutmen Bersama BUMN', 'Minimum Requirement for CPNS & State-Owned Enterprises')}
                </label>
                <span className={`font-mono font-black text-xs px-1.5 py-0.2 rounded ${
                  isDark ? 'text-slate-300 bg-white/10' : 'text-slate-700 bg-slate-200'
                }`}>
                  {cpnsTargetScore}
                </span>
              </div>
              <input
                type="range"
                min={400}
                max={500}
                step={5}
                value={cpnsTargetScore}
                onChange={(e) => setCpnsTargetScore(Number(e.target.value))}
                className="w-full h-1.5 accent-[#F7B425] cursor-pointer"
              />
            </div>

            {/* Validity Period */}
            <div className={`p-2 sm:p-2.5 rounded-lg border ${innerCardBg}`}>
              <CustomDropdown
                label={tr('Masa Berlaku Sertifikat', 'Certificate Validity Period')}
                value={String(validityPeriodYears)}
                onChange={(val) => setValidityPeriodYears(Number(val))}
                buttonClassName={isDark ? '!border-[#3a3a3a] !bg-[#181818] !py-1 !px-2.5 !rounded-lg !text-xs' : '!border-slate-300 !bg-white !py-1 !px-2.5 !rounded-lg !text-xs'}
                options={[
                  { value: '1', label: tr('1 Tahun Masa Berlaku', '1 Year Validity') },
                  { value: '2', label: tr('2 Tahun (Standar Resmi ETS)', '2 Years (Official ETS Standard)'), badge: tr('Rekomendasi', 'Recommended') },
                  { value: '3', label: tr('3 Tahun Masa Berlaku', '3 Years Validity') },
                ]}
              />
              <span className={`text-[9.5px] ${subText} mt-1 block`}>
                {tr('Standar resmi TOEFL Prediction ETS untuk keperluan beasiswa & administrasi', 'Official ETS TOEFL Prediction standard for scholarships and official administration')}
              </span>
            </div>

          </div>
        </div>

        {/* Right: Conversion Formula & Table (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-2 sm:space-y-2.5">
          
          {/* Formula Card */}
          <div className={`rounded-xl p-2.5 sm:p-3 border ${cardBg} space-y-1.5 transition-colors`}>
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/10 dark:border-white/10 border-slate-200">
              <Layers className="w-3.5 h-3.5 text-[#F7B425]" />
              <h3 className={`text-xs sm:text-sm font-bold font-['Poppins',sans-serif] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {tr('Rumus Perhitungan Skor TOEFL ITP', 'TOEFL ITP Score Calculation Formula')}
              </h3>
            </div>

            <div className={`p-2 sm:p-2.5 rounded-lg font-mono text-xs space-y-1.5 border ${innerCardBg}`}>
              <div className="text-[#F7B425] font-bold text-[11px]">{tr('Formula Skor Total:', 'Total Score Formula:')}</div>
              <div className={`p-1.5 rounded-md text-center text-xs font-bold text-[#F7B425] border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-amber-50 border-amber-200'
              }`}>
                Total = ((Scaled_L + Scaled_S + Scaled_R) × 10) ÷ 3
              </div>
              <p className={`text-[10px] leading-relaxed ${subText}`}>
                • Section 1 (Listening Comprehension): 50 Soal → Scaled 31-68<br />
                • Section 2 (Structure &amp; Written): 40 Soal → Scaled 31-68<br />
                • Section 3 (Reading Comprehension): 50 Soal → Scaled 31-67
              </p>
            </div>
          </div>

          {/* Conversion Sample Table */}
          <div className={`rounded-xl p-2.5 sm:p-3 border ${cardBg} transition-colors`}>
            <h3 className={`text-xs sm:text-sm font-bold font-['Poppins',sans-serif] mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {tr('Tabel Sampel Konversi Raw Score', 'Raw Score Conversion Sample Table')}
            </h3>

            <div className="overflow-x-auto rounded-lg border border-white/10 dark:border-white/10 border-slate-200">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b text-[9.5px] uppercase font-bold tracking-wider ${
                    isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-1 px-2.5 font-bold">{tr('Benar (Raw)', 'Correct (Raw)')}</th>
                    <th className="py-1 px-2 font-bold">Listening</th>
                    <th className="py-1 px-2 font-bold">Structure</th>
                    <th className="py-1 px-2 font-bold">Reading</th>
                    <th className="py-1 px-2.5 text-right font-bold">{tr('Skor Akhir', 'Final Score')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {conversionSamples.map((row, idx) => (
                    <tr key={idx} className={`transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    }`}>
                      <td className={`py-1 px-2.5 font-bold text-[10.5px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.raw}</td>
                      <td className={`py-1 px-2 text-[10px] ${subText}`}>{row.listening}</td>
                      <td className={`py-1 px-2 text-[10px] ${subText}`}>{row.structure}</td>
                      <td className={`py-1 px-2 text-[10px] ${subText}`}>{row.reading}</td>
                      <td className="py-1 px-2.5 text-right font-black text-[#F7B425] bg-[#F7B425]/10 text-[10.5px]">
                        {row.totalScaled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
