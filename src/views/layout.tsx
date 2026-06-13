import { html } from "hono/html";

export const Layout = (props: { title: string; children: any }) => {
  return html`
    <!DOCTYPE html>
    <html lang="en" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${props.title}</title>
        
        <!-- Google Fonts: Inter & Outfit -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Phosphor Icons -->
        <script src="https://unpkg.com/@phosphor-icons/web"></script>

        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                  heading: ['Outfit', 'sans-serif'],
                },
                colors: {
                  background: '#0B0F19',
                  surface: 'rgba(30, 41, 59, 0.4)',
                  surfaceHover: 'rgba(30, 41, 59, 0.7)',
                  primary: '#3B82F6',
                  accent: '#06B6D4',
                },
                animation: {
                  'blob': 'blob 7s infinite',
                  'fade-in': 'fadeIn 0.6s ease-out forwards',
                  'slide-up': 'slideUp 0.5s ease-out forwards',
                },
                keyframes: {
                  blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                  },
                  fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                  },
                  slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                  }
                }
              }
            }
          }
        </script>

        <style>
          /* Premium Custom Utilities */
          .glass-panel {
            background: var(--surface);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          
          .glass-panel-hover:hover {
            background: var(--surfaceHover);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.15);
          }

          /* Hide scrollbar for clean aesthetic */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }

          body {
            background-color: #0B0F19;
            background-image: 
              radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
              radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.15) 0px, transparent 50%);
            background-attachment: fixed;
            min-height: 100vh;
            color: #F8FAFC;
          }
        </style>
      </head>
      <body class="antialiased selection:bg-primary/30 selection:text-white">
        <!-- Background Blur Blobs -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div class="absolute top-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div class="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-white/10 mb-8">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg shadow-primary/20">
                <i class="ph-fill ph-hamburger text-2xl text-white"></i>
              </div>
              <div>
                <h1 class="font-heading text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                  Malaysia Promos
                </h1>
                <p class="text-slate-400 text-sm font-medium mt-1">Live Fast Food Deal Aggregator</p>
              </div>
            </div>
            
            <div class="mt-4 md:mt-0 flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span class="text-sm font-medium text-slate-300">Sync Active</span>
            </div>
          </header>
          
          <main>
            ${props.children}
          </main>
          
          <footer class="mt-16 pt-8 border-t border-white/10 text-center text-slate-500 text-sm pb-8">
            <p>Powered by Tavily AI & SQLite • Built with Hono</p>
          </footer>
        </div>
      </body>
    </html>
  `;
};
