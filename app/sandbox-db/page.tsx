import { db } from '../../db';
import { users, profiles, categories, siteSettings, links } from '../../db/schema';
import { redirect } from 'next/navigation';
import { SiteTheme } from '../../types/theme';
import { Database, Eye, User, Palette, Mail, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ action?: string }>;
}

async function seedDatabase() {
  // Clear any existing test data first (deleting users cascades to everything)
  await db.delete(users);

  // 1. Insert User
  const [user] = await db.insert(users).values({
    username: 'elise_roux',
    email: 'elise.roux@art.pl',
    passwordHash: 'hashed_password_123',
  }).returning();

  // 2. Insert Profile (localized Polish / English bio structures, profileImageUrl is omitted/unused in frontend)
  const [profile] = await db.insert(profiles).values({
    userId: user.userId,
    fullName: 'Élise Roux',
    bioPln: { 
      paragraphs: [
        "Mieszkam i pracuję w Warszawie, skupiając się na rzeźbie i malarstwie współczesnym.",
        "Moje prace eksplorują organiczne formy oraz relację między tradycyjną techniką a nowoczesnością."
      ] 
    },
    bioEng: { 
      paragraphs: [
        "I live and work in Warsaw, focusing on contemporary sculpture and painting.",
        "My work explores organic forms and the relationship between traditional technique and modernity."
      ] 
    },
  }).returning();

  // 3. Insert Social Links
  await db.insert(links).values([
    { profileId: profile.profileId, name: 'instagram', url: 'https://instagram.com/elise_roux' },
    { profileId: profile.profileId, name: 'behance', url: 'https://behance.net/elise_roux' },
    { profileId: profile.profileId, name: 'email', url: 'mailto:elise.roux@art.pl' }
  ]);

  // 4. Insert Categories
  await db.insert(categories).values([
    { userId: user.userId, namePln: 'Rzeźba', nameEng: 'Sculpture' },
    { userId: user.userId, namePln: 'Obraz', nameEng: 'Painting' }
  ]);

  // 5. Insert Site Settings (Theme with default warm minimalist settings from Figma)
  const mockTheme: SiteTheme = {
    fonts: {
      primaryFont: 'Playfair Display',
      secondaryFont: 'Inter',
      additionalFont: 'Inter',
    },
    colors: {
      primaryColor: '#3daaf3',    // Warm Charcoal
      secondaryColor: '#d6661b',  // Stone Gray
      additionalColor: '#1C1917', // Deep Off-Black
      accentColor: '#601b68',
      backgroundColor: '#F4F1EC', // Warm Cream Page Background
    },
    presetTheme: 'domyslny',
    darkModeExperimental: false,
  };

  await db.insert(siteSettings).values({
    userId: user.userId,
    theme: mockTheme,
    layoutBentoBox: {
      desktop: [
        { id: 'work-1', x: 0, y: 0, w: 2, h: 2 },
        { id: 'work-2', x: 2, y: 0, w: 1, h: 1 }
      ],
      mobile: [
        { id: 'work-1', x: 0, y: 0, w: 1, h: 1 }
      ]
    }
  });
}

async function clearDatabase() {
  await db.delete(users);
}

export default async function DatabaseSandboxPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  if (params.action === 'seed') {
    await seedDatabase();
    redirect('/sandbox-db');
  }

  if (params.action === 'clear') {
    await clearDatabase();
    redirect('/sandbox-db');
  }

  // Query records
  const allUsers = await db.select().from(users);
  const allProfiles = await db.select().from(profiles);
  const allLinks = await db.select().from(links);
  const allCategories = await db.select().from(categories);
  const allSiteSettings = await db.select().from(siteSettings);

  // Helper values
  const profile = allProfiles[0];
  const settings = allSiteSettings[0];
  const theme: SiteTheme | null = settings ? (settings.theme as SiteTheme) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-8 space-y-8">
      {/* Dynamic Fonts Import */}
      {theme && (
        <link 
          rel="stylesheet" 
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fonts.primaryFont)}&family=${encodeURIComponent(theme.fonts.secondaryFont)}&family=${encodeURIComponent(theme.fonts.additionalFont)}&display=swap`} 
        />
      )}

      {/* Page Header */}
      <header className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3">
          <a 
            href="/sandbox-db?action=seed" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-md text-xs transition-colors flex items-center gap-1 shadow-md"
          >
            [+] Seed Full Dataset
          </a>
          <a 
            href="/sandbox-db?action=clear" 
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 px-4 rounded-md text-xs transition-colors flex items-center gap-1 shadow-md"
          >
            [-] Wipe Database
          </a>
        </div>
      </header>

      {/* Split Views */}
      <div className="space-y-8">
        
        {/* SECTION 1: PROFILES & LINKS TABLE */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Table: `profile` & `links` (Artist Bio & Social Links)</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT WINDOW: RAW DATABASE */}
            <div className="p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" /> Raw Database Rows
              </div>
              <pre className="bg-slate-900 text-[10px] font-mono p-4 rounded-lg overflow-auto max-h-80 border border-slate-800 text-emerald-400">
                {JSON.stringify({ profile: profile || "No data (Click seed)", links: allLinks.length ? allLinks : "No data" }, null, 2)}
              </pre>
            </div>

            {/* RIGHT WINDOW: FRONTEND UI (No profile pic) */}
            <div className="p-5 flex flex-col justify-center bg-slate-900/20">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-4">
                <Eye className="w-3.5 h-3.5" /> Frontend UI Component
              </div>

              {profile ? (
                <div className="bg-white text-stone-900 p-6 rounded-xl border border-slate-200 max-w-md mx-auto w-full space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold font-serif text-stone-800">{profile.fullName}</h3>
                    <p className="text-xs text-stone-400 uppercase tracking-widest">Artist Portfolio</p>
                  </div>

                  <div className="space-y-2 text-xs text-stone-600 leading-relaxed font-sans">
                    {(profile.bioPln as { paragraphs?: string[] })?.paragraphs?.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2 border-t text-stone-700">
                    {allLinks.map((link) => (
                      <a 
                        key={link.linkId} 
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 py-1.5 px-3 rounded-md text-[10px] font-semibold transition-colors"
                      >
                        {link.name === 'email' ? <Mail className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span className="capitalize">{link.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 italic">
                  No profile data found in database. Please click "Seed Database" above.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: SITE SETTINGS (THEME) TABLE */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">Table: `site_settings` (Custom Theme Configuration)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT WINDOW: RAW DATABASE */}
            <div className="p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" /> Raw Database Rows
              </div>
              <pre className="bg-slate-900 text-[10px] font-mono p-4 rounded-lg overflow-auto max-h-80 border border-slate-800 text-indigo-400">
                {JSON.stringify({ theme: theme || "No data (Click seed)" }, null, 2)}
              </pre>
            </div>

            {/* RIGHT WINDOW: FRONTEND UI */}
            <div className="p-5 flex flex-col justify-center bg-slate-900/20">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-4">
                <Eye className="w-3.5 h-3.5" /> Frontend UI Component
              </div>

              {theme ? (
                <div 
                  className="p-6 rounded-xl border border-stone-200/20 max-w-md mx-auto w-full space-y-3 shadow-sm text-left"
                  style={{ 
                    backgroundColor: theme.colors.backgroundColor, 
                    color: theme.colors.additionalColor,
                    fontFamily: theme.fonts.secondaryFont
                  }}
                >
                  <p 
                    className="text-base font-bold"
                    style={{ fontFamily: theme.fonts.primaryFont, color: theme.colors.primaryColor }}
                  >
                    Primary Font & Color: "{theme.fonts.primaryFont}" ({theme.colors.primaryColor})
                  </p>
                  
                  <p 
                    className="text-xs"
                    style={{ fontFamily: theme.fonts.secondaryFont, color: theme.colors.secondaryColor }}
                  >
                    Secondary Font & Color: "{theme.fonts.secondaryFont}" ({theme.colors.secondaryColor})
                  </p>
                  
                  <p 
                    className="text-xs"
                    style={{ fontFamily: theme.fonts.additionalFont, color: theme.colors.additionalColor }}
                  >
                    Additional Font & Color: "{theme.fonts.additionalFont}" ({theme.colors.additionalColor})
                  </p>
                  
                  <div className="pt-3 border-t border-stone-300/40 flex items-center justify-between text-[10px]">
                    <span>Preset: {theme.presetTheme}</span>
                    <span 
                      className="text-white px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider" 
                      style={{ backgroundColor: theme.colors.accentColor }}
                    >
                      Accent: {theme.colors.accentColor}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 italic">
                  No theme settings found in database. Please click "Seed Database" above.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
