import React from 'react';
import { ArrowRight, Instagram, MessageCircle, Sparkles, CheckCircle, Phone } from 'lucide-react';
import { CONTACT_INFO } from '../../data/mockData';
import { useLanguage } from '../../context/LanguageContext';

interface CtaSectionProps {
  onOpenRegister: () => void;
  onOpenQuiz: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenRegister }) => {
  const { tr, language } = useLanguage();

  return (
    <section id="cta" className="py-20 lg:py-28 bg-[#F7B425] text-black relative overflow-hidden">
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      {/* Decorative Circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/10 blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading text-black tracking-tight leading-[1.1] mb-6 uppercase">
          {language === 'id' ? (
            <>
              GABUNG SEKARANG &amp; MULAI <br className="hidden sm:inline" />
              <span 
                style={{ borderRadius: '36px', width: '580px', maxWidth: '100%' }}
                className="bg-black text-[#F7B425] px-4 py-1 rounded-[36px] inline-block mt-2 sm:mt-1 shadow-2xl"
              >
                PERJALANANMU!
              </span>
            </>
          ) : (
            <>
              JOIN NOW &amp; START <br className="hidden sm:inline" />
              <span 
                style={{ borderRadius: '36px', width: '580px', maxWidth: '100%' }}
                className="bg-black text-[#F7B425] px-4 py-1 rounded-[36px] inline-block mt-2 sm:mt-1 shadow-2xl"
              >
                YOUR JOURNEY!
              </span>
            </>
          )}
        </h2>

        {/* Supporting Text */}
        <p className="text-lg sm:text-2xl text-black font-bold leading-relaxed max-w-3xl mx-auto mb-8">
          {tr(
            '“Masa depanmu menanti. Mari kita bangun bersama!”',
            '“Your future is waiting. Let’s build together!”'
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            id="cta-register-button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-10 py-4 rounded-full font-black text-base text-[#F7B425] bg-black hover:bg-zinc-900 shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 group cursor-pointer"
          >
            <span>{tr('Daftar Sekarang', 'Enroll Now')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href={CONTACT_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-extrabold text-base text-black bg-white hover:bg-slate-100 shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <span>{tr('Chat WhatsApp Sir Alwi', 'WhatsApp Sir Alwi')}</span>
          </a>
        </div>

        {/* Value Points */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-extrabold text-black mb-12">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-black" />
            <span>{tr('Pembelajaran Interaktif & Seru', 'Interactive & Fun Learning')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-black" />
            <span>{tr('Komunikasi Skala Global', 'Global Communication')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-black" />
            <span>{tr('Masa Depan Lebih Cerah', 'Brighter Future Ahead')}</span>
          </div>
        </div>

        {/* Direct Contact Card Strip */}
        <div 
          style={{ borderRadius: '36px' }}
          className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-black/90 text-white backdrop-blur-md border border-black/30 rounded-[36px] px-8 py-5 shadow-2xl"
        >
          <div className="text-xs font-black uppercase tracking-wider text-[#F7B425]">
            {tr('UNTUK PENDAFTARAN HUBUNGI :', 'FOR REGISTRATION CONTACT :')}
          </div>

          <div className="hidden sm:block w-px h-6 bg-white/20" />

          <a
            href={CONTACT_INFO.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#F7B425] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#F7B425] text-black flex items-center justify-center">
              <Instagram className="w-4 h-4" />
            </div>
            <span>Instagram : {CONTACT_INFO.instagram}</span>
          </a>

          <div className="hidden sm:block w-px h-6 bg-white/20" />

          <a
            href={CONTACT_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#F7B425] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#F7B425] text-black flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <span>Whatsapp : {CONTACT_INFO.phoneDisplay}</span>
          </a>
        </div>

      </div>
    </section>
  );
};
