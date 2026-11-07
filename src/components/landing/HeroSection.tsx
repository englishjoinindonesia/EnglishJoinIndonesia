import React from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import heroStudentImg from '../../assets/images/regenerated_image_1787222184652.png';
import { CONTACT_INFO } from '../../data/mockData';
import { useLanguage } from '../../context/LanguageContext';

interface HeroSectionProps {
  onOpenRegister: () => void;
  onOpenQuiz: () => void;
  onOpenLogin?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenRegister, onOpenLogin }) => {
  const { t, language } = useLanguage();

  return (
    <section
      id="home"
      style={{ height: '760px', paddingBottom: '118px' }}
      className="relative h-[760px] pt-28 pb-[118px] lg:pt-36 lg:pb-[118px] overflow-hidden bg-[#0A0A0A] flex items-center"
    >
      {/* Background Decorative Lighting & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F7B425]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#F7B425]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Main Headline */}
            <div className="mb-5 space-y-1">
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
                {t.hero.title1}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight leading-tight">
                <span className="text-[#F7B425]">
                  {t.hero.title2}
                </span>
              </h1>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
                {t.hero.title3}
              </span>
            </div>

            {/* Sub-heading */}
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mb-[10px] font-normal">
              {t.hero.desc}
            </p>

            {/* Callout with Handwritten accent */}
            <div className="flex items-baseline gap-2 mb-8 text-slate-200 text-sm sm:text-base">
              <span className="font-handwriting text-3xl sm:text-4xl text-[#F7B425] font-bold -rotate-6 transform inline-block">
                {language === 'id' ? 'Yuk,' : "Let's"}
              </span>
              <span>
                {language === 'id' 
                  ? 'Tingkatkan kemampuan Bahasa Inggrismu bersama kami di ' 
                  : 'Level up your English fluency and confidence with us at '}
                <strong className="text-[#F7B425] font-extrabold">English Join Indonesia.</strong>
              </span>
            </div>

            {/* CTA Buttons Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button
                id="hero-primary-cta"
                onClick={onOpenLogin || onOpenRegister}
                className="relative group overflow-hidden px-8 py-4 rounded-full font-black text-base text-black bg-[#F7B425] hover:bg-[#ffbe33] shadow-xl shadow-[#F7B425]/25 hover:shadow-2xl hover:shadow-[#F7B425]/40 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>{t.hero.ctaPrimary}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>

                {/* Glossy / Mengkilap Shimmer Reflection Sweep on Hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-700 bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform ease-out pointer-events-none" />

                {/* Ambient Top Glow Reflection */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <a
                id="hero-wa-cta"
                href={CONTACT_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-4 rounded-full font-bold text-base text-white bg-white/5 hover:bg-white/10 border border-[#F7B425]/40 hover:border-[#F7B425] transition-all duration-300 flex items-center justify-center gap-2.5"
              >
                <MessageCircle className="w-5 h-5 text-[#F7B425]" />
                <span>{t.hero.ctaWa}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Hero Visuals */}
          <div className="lg:col-span-6 relative mt-4 lg:mt-0 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-xl">
              
              {/* Glow backdrop ring */}
              <div className="absolute -inset-6 bg-gradient-to-tr from-[#F7B425]/30 via-amber-500/15 to-transparent rounded-3xl blur-3xl opacity-80" />

              {/* Student Image Container */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden bg-transparent">
                  <img
                    src={heroStudentImg}
                    alt="Siswa English Join Indonesia belajar bahasa inggris dari nol"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain rounded-2xl shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
                  />
                </div>

                {/* Micro Stats Strip */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-base sm:text-lg font-black text-[#F7B425]">1,500+</span>
                    <p className="text-xs font-medium text-slate-300">{t.hero.alumniCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-base sm:text-lg font-black text-[#F7B425]">4.9 / 5.0 ⭐</span>
                    <p className="text-xs font-medium text-slate-300">{t.hero.ratingText}</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

