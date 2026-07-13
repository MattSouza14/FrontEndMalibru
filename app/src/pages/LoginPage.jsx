export default function LoginPage() {
  return (
        <div className = "min-h-screen flex items-center justify-center bg-gray-100">
            <div className = "w-full max-w-[440px] bg-white border border-primary/10 shadow-[0_15px_50px_ -12px_rgba(6,78,59,0.08)] p-10 md:p-14 animate-reveal">
            {/* Logo e Header */}
                <div className = "text-center mb-14">
                    <div className = "mb-4 inline-block">
                        <div className = "size-10 border border-primary/10 flex items-center justify-center">
                            <div className = "size-6 bg-primary">
                            </div>
                        </div>
                        <h1 className = "font-serif text-4xl text-primary mb-2 font-medium tracking-tight">
                            Malibru
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-primary/50 font-semibold">
                             Portal Institucional
                        </p>
                    </div>
                    <form action="" className="space-y-6">
                        <label className="block group space-y-1.5">
                        <span className="text-[10px] uppercase trackin-widest text-muted-foreground font-bold px-0.5 group-focus-within:text-primary transition-colors">
                            Identificação    
                        </span>
                        <input type="email"
                               required
                               autoComplete="email"
                               className="w-full px-4 py-3.5 bg-white border border-border focus:border-primary focus:ring-0 focus:outline-none transition-all text-foreground text-sm font-light placeholder:text-muted-foreground/50"
                               placeholder="voce@empresa.com.br" />
                        
                    </label>

                    <label className="block group space-y-1.5">
                        <div className="flex justify-between items-end px-0.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold group-focus-within:text-primary transition-colors">
                            Senha
                        </span>
                    <a
                        href="#"
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors mb-0.5"
                    >
                        Esqueci minha senha
                    </a>
                    </div>
                        <input
                        type="password"
                        required
                        autoComplete="current-password"
                        className="w-full px-4 py-3.5 bg-white border border-border focus:border-primary focus:ring-0 focus:outline-none transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                        placeholder="••••••••"
                        />
                    </label>
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-md hover:shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer">
                                Acessar Sistema
                        </button>
                    </div>
                    <div className="flex items-center space-x-3 pt-2">
                    <div className="flex-1 h-px bg-border" />
                        <label className="flex items-center space-x-2 cursor-pointer group">
                         <input
                            type="checkbox"
                            className="size-3 border-border text-primary focus:ring-0 rounded-none cursor-pointer"/>
                            <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                                Manter conectado
                            </span>
                        </label>
                    <div className="flex-1 h-px bg-border" />
                    </div>
                    </form>
                <div className="mt-16 text-center">
                    <div className="flex items-center justify-between text-xs mb-4">
                     <a
                        href="https://malibru.com.br"
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        >
                        Site institucional ↗
                    </a>
                </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest opacity-60">
                        Malibru &copy; 2026
                    </p>
         </div>
       </div>
     </div>
    </div>
  );
}