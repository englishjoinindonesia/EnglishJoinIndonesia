import React from 'react';
import { SearchCheck, BookOpenCheck, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LearningProcessProps {
  onOpenRegister: () => void;
}

export const LearningProcess: React.FC<LearningProcessProps> = ({ onOpenRegister }) => {
  const { tr } = useLanguage();

  const learningSteps = [
    {
      step: '01',
      title: tr('Pilih Program', 'Choose Program'),
      tagline: tr('Temukan yang Paling Pas', 'Find Your Best Fit'),
      description: tr(
        'Temukan program yang sesuai dengan kebutuhan, level awal, dan target masa depanmu.',
        'Find the program tailored to your starting level, goals, and schedule.'
      ),
      iconName: 'SearchCheck',
      details: [
        tr('Konsultasi gratis via WhatsApp dengan Sir Alwi & tim', 'Free WhatsApp consultation with Sir Alwi & academic team'),
        tr('Cek level kemampuan awal secara singkat', 'Quick initial placement and assessment'),
        tr('Pilih jadwal kelas (Pagi, Sore, atau Malam)', 'Choose class slots (Morning, Afternoon, or Evening)')
      ]
    },
    {
      step: '02',
      title: tr('Mulai Belajar', 'Start Learning'),
      tagline: tr('Praktik Interaktif & Menyenangkan', 'Interactive & Engaging Practice'),
      description: tr(
        'Ikuti pembelajaran dengan materi yang mudah dipahami, tutor interaktif, dan latihan speaking langsung.',
        'Engage in easy-to-understand lessons, interactive tutors, and real-time speaking practice.'
      ),
      iconName: 'BookOpenCheck',
      details: [
        tr('Akses ke kelas live interaktif dan modul lengkap', 'Live interactive classes with complete learning modules'),
        tr('Praktik aktif bersama mentor & teman sekelas', 'Active practice with mentor & peer discussion'),
        tr('Tanya jawab langsung tanpa rasa sungkan', 'Direct Q&A in a friendly, supportive environment')
      ]
    },
    {
      step: '03',
      title: tr('Grow & Achieve', 'Grow & Achieve'),
      tagline: tr('Raih Target & Peluang Baru', 'Reach Goals & New Horizons'),
      description: tr(
        'Tingkatkan kemampuanmu, dapatkan sertifikat resmi, dan raih peluang pendidikan serta karier yang lebih besar.',
        'Boost your skills, earn official certificates, and open doors to global education and careers.'
      ),
      iconName: 'Trophy',
      details: [
        tr('Skor TOEFL meningkat & kemampuan speaking terasah', 'Higher TOEFL scores & fluent conversational skills'),
        tr('Dapatkan sertifikat resmi kelulusan program', 'Official verified graduation certificate'),
        tr('Buka pintu karier BUMN, CPNS, beasiswa, & global', 'Unlock careers in BUMN, civil service, scholarships & global companies')
      ]
    }
  ];

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'SearchCheck':
        return <SearchCheck className="w-7 h-7" />;
      case 'BookOpenCheck':
        return <BookOpenCheck className="w-7 h-7" />;
      case 'Trophy':
        return <Trophy className="w-7 h-7" />;
      default:
        return <SearchCheck className="w-7 h-7" />;
    }
  };

  return (
    <section id="learning-process" className="py-20 lg:py-32 bg-[#0F0F0F] relative overflow-hidden">
      {/* Background Dots Pattern */}
      <div className="absolute inset-0 bg-dots-pattern opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight mb-4">
            {tr('Belajar Itu Bisa', 'Your Learning Journey')}{' '}
            <span className="text-[#F7B425]">{tr('Dimulai Hari Ini', 'Begins Today')}</span>.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal">
            {tr(
              'Hanya 3 langkah sederhana untuk memulai transformasi kemampuan Bahasa Inggrismu bersama mentor terbaik.',
              'Just 3 simple steps to transform your English fluency with the best mentors.'
            )}
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-16 right-16 h-0.5 bg-gradient-to-r from-[#F7B425]/20 via-[#F7B425] to-[#F7B425]/20 -translate-y-12 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-8 relative z-10">
            {learningSteps.map((step) => (
              <div
                key={step.step}
                className="group relative bg-[#171717] hover:bg-[#1E1E1E] border-0 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-[#F7B425]/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-black border-2 border-[#F7B425] text-[#F7B425] group-hover:bg-[#F7B425] group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-lg shadow-[#F7B425]/20">
                      {getStepIcon(step.iconName)}
                    </div>

                    <span 
                      style={{ color: '#f7b425' }}
                      className="text-4xl font-black font-heading text-[#F7B425] transition-colors"
                    >
                      {step.step}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#F7B425] uppercase tracking-wider block mb-1">
                    {tr('Langkah', 'Step')} {step.step} • {step.tagline}
                  </span>

                  <h3 className="text-2xl font-bold font-heading text-white mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#F7B425] flex-shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Fast Action Prompt */}
        <div className="mt-16 text-center">
          <button
            onClick={onOpenRegister}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-extrabold text-sm text-black bg-[#F7B425] hover:bg-[#ffbe33] shadow-xl shadow-[#F7B425]/20 transition-all duration-300 transform active:scale-95 cursor-pointer"
          >
            <span>{tr('Mulai Langkah Pertama Sekarang', 'Take Your First Step Today')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
