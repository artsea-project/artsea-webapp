"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavLinksProps {
  primaryColor: string;
  secondaryColor: string;
  bodyFont: string;
}

const NAV_ITEMS = [
  { name: "O MNIE", href: "/o-mnie" },
  { name: "PORTFOLIO", href: "/" },
  { name: "KONTAKT", href: "/kontakt" },
];

export default function NavLinks({ primaryColor, secondaryColor, bodyFont }: NavLinksProps) {
  const pathname = usePathname();
  const [currentLang, setCurrentLang] = useState<"PL" | "EN">("PL");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <nav 
        className="hidden md:flex items-center gap-12 lg:gap-16 text-xs font-normal uppercase tracking-widest"
        style={{ fontFamily: bodyFont }}
      >
        <div className="flex items-center gap-12 lg:gap-16">
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            const color = active ? primaryColor : secondaryColor;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors duration-200 hover:opacity-80"
                style={{ color }}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 ml-16 lg:ml-28 text-xs font-normal">
          <button
            type="button"
            onClick={() => setCurrentLang("PL")}
            className="transition-colors duration-200 focus:outline-none"
            style={{ color: currentLang === "PL" ? primaryColor : secondaryColor }}
            aria-label="Switch language to Polish"
          >
            PL
          </button>
          <span style={{ color: secondaryColor }} className="opacity-40">/</span>
          <button
            type="button"
            onClick={() => setCurrentLang("EN")}
            className="transition-colors duration-200 focus:outline-none"
            style={{ color: currentLang === "EN" ? primaryColor : secondaryColor }}
            aria-label="Switch language to English"
          >
            EN
          </button>
        </div>
      </nav>

      <div className="md:hidden flex items-center gap-4">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 transition-colors focus:outline-none"
          style={{ color: primaryColor }}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 py-6 px-6 flex flex-col gap-4 text-xs font-normal uppercase tracking-widest shadow-lg z-50"
          style={{ fontFamily: bodyFont }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            const color = active ? primaryColor : secondaryColor;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 transition-colors duration-200"
                style={{ color }}
              >
                {item.name}
              </Link>
            );
          })}

          <div className="flex items-center gap-2 pt-4 border-t border-stone-100 text-xs font-normal">
            <button
              type="button"
              onClick={() => {
                setCurrentLang("PL");
                setMobileMenuOpen(false);
              }}
              style={{ color: currentLang === "PL" ? primaryColor : secondaryColor }}
            >
              PL
            </button>
            <span style={{ color: secondaryColor }} className="opacity-40">/</span>
            <button
              type="button"
              onClick={() => {
                setCurrentLang("EN");
                setMobileMenuOpen(false);
              }}
              style={{ color: currentLang === "EN" ? primaryColor : secondaryColor }}
            >
              EN
            </button>
          </div>
        </div>
      )}
    </>
  );
}
