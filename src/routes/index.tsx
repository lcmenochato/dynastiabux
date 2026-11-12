import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Trash2, User, Lock, Check, Loader2, Menu, ShoppingCart, Search, Star, Mail, MessageCircle, Crown, BadgeCheck } from "lucide-react";
import logoImg from "@/assets/logo.png.asset.json";
import rv17 from "@/assets/review-17.jpg.asset.json";
import rv18 from "@/assets/review-18.jpg.asset.json";
import rv19 from "@/assets/review-19.jpg.asset.json";
import rv20 from "@/assets/review-20.jpg.asset.json";
import rv21 from "@/assets/review-21.jpg.asset.json";
import banner from "@/assets/banner.png.asset.json";
import img700 from "@/assets/robux-700.png.asset.json";
import img1200 from "@/assets/robux-1200.png.asset.json";
import img1700 from "@/assets/robux-1700.png.asset.json";
import img2100 from "@/assets/robux-2100.png.asset.json";
import img3600 from "@/assets/robux-3600.png.asset.json";
import img4500 from "@/assets/robux-4500.png.asset.json";
import img7000 from "@/assets/robux-7000.png.asset.json";
import img10000 from "@/assets/robux-10000.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kingdom Robux — Robux barato e entrega rápida" },
      { name: "description", content: "Compre Robux com os melhores preços do Brasil. 10% OFF na primeira compra." },
      { property: "og:title", content: "Kingdom Robux — Robux barato" },
      { property: "og:description", content: "Os melhores preços em Robux. 10% OFF na primeira compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const products = [
  { amount: 700, price: 0, old: 0, img: "/images/robux-700.png?v=prata-esgotado-20261029", soldOut: true },
  { amount: 1200, price: 19.9, old: 24, img: "https://i.postimg.cc/MpkRXfMn/file-000000006234820e9c09a119ad2a2f94.png" },
  { amount: 1700, price: 24.9, old: 32, img: "https://i.postimg.cc/YCcgjLGL/file-00000000fc10820eb49348f5b3585276.png" },
  { amount: 2100, price: 29.9, old: 39, img: "https://i.postimg.cc/4xCtnH79/file-00000000f5c0820ea8e1d81fda5bbd09.png" },
  { amount: 3600, price: 44.9, old: 59, img: "https://i.postimg.cc/CxyDdnBb/file-000000004720820e96fffc337c6809b4.png" },
  { amount: 4500, price: 59.9, old: 79, img: "https://i.postimg.cc/bJvS4QWh/file-00000000f19c820e8dcde8a3b4aefe8a.png" },
  { amount: 7000, price: 89.9, old: 119, img: "https://i.postimg.cc/pTd53D4t/Promo-Neon-Roblox-7000-Robux.png" },
  { amount: 10000, price: 119.9, old: 159, img: "https://i.postimg.cc/1tzVbp21/file-0000000070f0820e9e69a95a97920c59.png" },
];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ProductCard({ p, onAdd }: { p: (typeof products)[0]; onAdd: () => void }) {
  const soldOut = "soldOut" in p && p.soldOut;
  return (
    <div className="w-48 sm:w-52 shrink-0 snap-start overflow-hidden rounded-3xl border border-border bg-card shadow-gold">
      <img src={p.img} alt={`${p.amount} Robux`} width={1024} height={1536} loading="lazy" className="aspect-[2/3] w-full object-cover" />
      <div className="space-y-1.5 p-3">
        <h3 className="font-display text-base font-bold">{p.amount.toLocaleString("pt-BR")} ROBUX</h3>
        <div className="flex items-center gap-1 text-primary">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
          <span className="ml-1 text-sm text-muted-foreground">({40 + p.amount % 97})</span>
        </div>
        <div className="flex items-baseline gap-2">
          {soldOut ? (
            <span className="font-display text-xl font-extrabold text-muted-foreground">Esgotado</span>
          ) : (
            <>
              <span className="font-display text-xl font-extrabold text-primary">{brl(p.price)}</span>
              <span className="text-sm text-muted-foreground line-through">{brl(p.old)}</span>
            </>
          )}
        </div>
        {soldOut ? (
          <button disabled className="w-full cursor-not-allowed rounded-full bg-muted py-2.5 font-bold text-muted-foreground">
            Esgotado
          </button>
        ) : (
          <button onClick={onAdd} className="w-full rounded-full bg-gold py-2.5 font-bold text-primary-foreground transition hover:brightness-110">
            Comprar
          </button>
        )}
      </div>
    </div>
  );
}

function Logo({ big }: { big?: boolean }) {
  return <img src="https://i.postimg.cc/rw2wtRHX/1793307418253.png" alt="Kingdom Robux" className={big ? "w-52 max-w-full h-auto object-contain" : "h-20 sm:h-24 w-auto max-w-[280px] object-contain"} />;
}

const reviews: { name: string; text: string; img?: string }[] = [
  { name: "gui_rbx", text: "Chegou certinho, olha meus robux aí! 5,7 mil na conta 🔥", img: "/images/review-17.jpg?v=20261016b" },
  { name: "nyx.dark", text: "Já comprei várias vezes, 27,3 mil robux e nunca tive problema!", img: "/images/review-18.jpg?v=20261016b" },
  { name: "davizinho", text: "18K na conta, entrega rapidinha. Melhor loja!", img: "/images/review-19.jpg?v=20261016b" },
  { name: "mari_cute", text: "Recebi meus robux em minutos, super confiável 💛", img: "/images/review-20.jpg?v=20261016b" },
  { name: "lari.rblx", text: "Caiu tudo certinho, já tô comprando roupa nova kkkk", img: "/images/review-21.jpg?v=20261016b" },
  { name: "manunana", text: "Melhorrrrr loja pqp não aguentava mais só golpe e golpe, recomendo pessoal" },
  { name: "igabriel", text: "Pedido demorou poucos minutos e meu robux caiu certinho, muito confiável!" },
  { name: "luana_rbx", text: "Preço muito bom, já comprei 3 vezes e sempre chega rápido." },
  { name: "pedrinho77", text: "Atendimento top no Discord, me ajudaram em tudo. Nota 10!" },
  { name: "julinhaxx", text: "Comprei 1.700 e chegou em menos de 10 minutos, amei demais!" },
  { name: "kauã_br", text: "Achei que era golpe mas veio certinho kkkk virei cliente fiel" },
  { name: "biazinha.rbx", text: "Melhor preço que achei, usei o cupom e ficou mais barato ainda." },
  { name: "matheusgamer", text: "Já é minha quinta compra, nunca tive problema. Recomendo!" },
  { name: "sofia_2012", text: "Suporte respondeu super rápido, entrega perfeita 💛" },
  { name: "lucasrblx", text: "Pix caiu na hora e os robux vieram logo depois. Top demais." },
];

const faqs = [
  { q: "Como posso saber que é confiável?", a: "Temos milhares de clientes satisfeitos e uma comunidade enorme no Discord. Confira as avaliações reais logo acima." },
  { q: "Em quanto tempo vou receber meu pedido?", a: "A maioria dos pedidos é entregue em poucos minutos após a confirmação do pagamento." },
  { q: "Posso cancelar minha compra após o pagamento?", a: "Se o pedido ainda não foi entregue, você pode solicitar o cancelamento pelo suporte. Veja nossa Política de reembolso." },
  { q: "Como entro em contato com o suporte?", a: "Pelo e-mail suporte@kingdomrobux.com ou pelo nosso servidor no Discord." },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="w-full rounded-3xl border border-border bg-card p-6 text-left shadow-gold">
      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-semibold">{q}</span>
        {open ? <Minus className="h-5 w-5 shrink-0 text-primary" /> : <Plus className="h-5 w-5 shrink-0 text-primary" />}
      </div>
      {open && <p className="mt-3 text-muted-foreground">{a}</p>}
    </button>
  );
}


function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const field = "mt-2 w-full rounded-2xl border border-white/10 bg-[#141414] px-4 py-4 text-white outline-none transition-colors focus:border-slate-400";
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = `Nome: ${name}\nE-mail: ${email}\nCódigo do pedido: ${order || "Não informado"}\nAssunto: ${subject}\n\nMensagem:\n${message}`;
    window.location.href = `mailto:suporte@kingdombuxoficial.com?subject=${encodeURIComponent("Suporte Kingdom Robux - " + subject)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <main className="min-h-[75vh] bg-[#0b0b0c] px-5 pb-24 pt-10 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">ATENDIMENTO</p>
        <h1 className="mt-3 text-4xl font-semibold">Abrir ticket</h1>
        <p className="mt-5 leading-7 text-slate-400">Preencha os dados abaixo para entrar em contato com nossa equipe de suporte.</p>
        <form onSubmit={submit} className="mt-9 space-y-6 rounded-[2rem] border border-white/10 bg-[#161616] p-6 sm:p-9">
          <label className="block font-semibold">Nome<input className={field} value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></label>
          <label className="block font-semibold">E-mail<input className={field} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label className="block font-semibold">Código do pedido (opcional)<input className={field} value={order} onChange={e => setOrder(e.target.value)} placeholder="KING-..." /></label>
          <label className="block font-semibold">Assunto<input className={field} value={subject} onChange={e => setSubject(e.target.value)} required /></label>
          <label className="block font-semibold">Mensagem<textarea className={field + " min-h-40 resize-y"} value={message} onChange={e => setMessage(e.target.value)} required rows={5} /></label>
          <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-slate-300 via-white to-slate-400 px-6 py-4 text-lg font-bold text-[#17191c]">Enviar mensagem</button>
          <p className="text-center text-xs leading-5 text-slate-400">O botão abre seu aplicativo de e-mail com a mensagem preenchida. O envio é concluído no aplicativo de e-mail.</p>
        </form>
      </div>
    </main>
  );
}

const demoPurchases = [
  { name: "Julia", amount: 4500, image: "https://i.postimg.cc/bJvS4QWh/file-00000000f19c820e8dcde8a3b4aefe8a.png" },
  { name: "Gustavo", amount: 2100, image: "https://i.postimg.cc/4xCtnH79/file-00000000f5c0820ea8e1d81fda5bbd09.png" },
  { name: "Roberto", amount: 1200, image: "https://i.postimg.cc/MpkRXfMn/file-000000006234820e9c09a119ad2a2f94.png" },
  { name: "Ana", amount: 1700, image: "https://i.postimg.cc/YCcgjLGL/file-00000000fc10820eb49348f5b3585276.png" },
  { name: "Lucas", amount: 3600, image: "https://i.postimg.cc/CxyDdnBb/file-000000004720820e96fffc337c6809b4.png" },
  { name: "Mariana", amount: 7000, image: "https://i.postimg.cc/pTd53D4t/Promo-Neon-Roblox-7000-Robux.png" },
  { name: "Pedro", amount: 10000, image: "https://i.postimg.cc/1tzVbp21/file-0000000070f0820e9e69a95a97920c59.png" },
  { name: "Beatriz", amount: 4500, image: "https://i.postimg.cc/bJvS4QWh/file-00000000f19c820e8dcde8a3b4aefe8a.png" },
  { name: "Rafael", amount: 1200, image: "https://i.postimg.cc/MpkRXfMn/file-000000006234820e9c09a119ad2a2f94.png" },
  { name: "Camila", amount: 2100, image: "https://i.postimg.cc/4xCtnH79/file-00000000f5c0820ea8e1d81fda5bbd09.png" },
];
function DemoPurchasePopup() {
  const [current, setCurrent] = useState(-1);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let position = 0;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setCurrent(position % demoPurchases.length);
      position += 1;
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 5000);
    };
    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      show();
      interval = setInterval(show, 6000);
    }, 5000);
    return () => { clearTimeout(first); if (interval) clearInterval(interval); if (hideTimer) clearTimeout(hideTimer); };
  }, []);
  const item = demoPurchases[current];
  if (!item) return null;
  return (
    <aside aria-label="Demonstração de notificação" className={`pointer-events-none fixed bottom-5 left-3 z-40 w-[min(340px,calc(100vw-24px))] transition-all duration-1000 ease-in-out ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-500/50 bg-[#111214]/95 p-3 text-white shadow-2xl backdrop-blur">
        <img src={item.image} alt="" className="h-20 w-14 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="mt-1 text-base font-bold">{item.name} comprou {item.amount.toLocaleString("pt-BR")} Robux</p>
          <p className="mt-1 text-xs text-slate-400">Demonstração</p>
        </div>
      </div>
    </aside>
  );
}

export function Index() {
  const [items, setItems] = useState<Record<number, number>>({});
  const [view, setView] = useState<"home" | "checkout" | "pix" | "support">("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = Object.values(items).reduce((a, b) => a + b, 0);
  const add = (amount: number) => { setItems((it) => ({ ...it, [amount]: (it[amount] || 0) + 1 })); setView("checkout"); window.scrollTo(0, 0); };
  const [q, setQ] = useState("");
  const list = products.filter((p) => `${p.amount} robux`.includes(q.toLowerCase().replace(/\./g, "")));
  const productScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = productScrollRef.current;
    if (!el || list.length === 0) return;
    el.scrollLeft = el.scrollWidth / 3;
  }, [q, view]);
  useEffect(() => {
    if (view !== "home" || list.length === 0) return;
    const el = productScrollRef.current;
    if (!el) return;
    let frame = 0;
    let previous = 0;
    let pausedUntil = 0;
    const pause = () => { pausedUntil = performance.now() + 3500; };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });
    const animate = (now: number) => {
      if (previous && now - previous < 150 && now > pausedUntil && !document.hidden) {
        el.scrollLeft += (now - previous) * 0.045;
      }
      previous = now;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("wheel", pause);
    };
  }, [q, view]);

  const loopProductScroll = () => {
    const el = productScrollRef.current;
    if (!el || list.length === 0) return;
    const third = el.scrollWidth / 3;
    if (el.scrollLeft < third * 0.5) el.scrollLeft += third;
    else if (el.scrollLeft > third * 1.5) el.scrollLeft -= third;
  };
  const marquee = "👑 KINGDOM ROBUX   ROBUXBARATO   10% OFF NA SUA PRIMEIRA COMPRA!   ";

  return (
    <div className="min-h-screen bg-kingdom font-sans">
      
      {view === "home" && <DemoPurchasePopup />}
      <div className="overflow-hidden bg-gold py-2 text-primary-foreground">
        <div className="flex w-max animate-marquee whitespace-pre font-display text-sm font-extrabold">
          {marquee.repeat(6)}
        </div>
      </div>

      <header className="sticky top-0 z-10 border-b-2 border-primary/60 bg-background/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu className="h-7 w-7" /></button>
          <button onClick={() => setView("home")} aria-label="Início" className="flex min-w-0 items-center justify-center"><img src="https://i.postimg.cc/FKjWs8L5/1793321103487.png" alt="Kingdom Robux prata" className="h-16 w-auto max-w-[230px] object-contain sm:h-20" /></button>
          <button onClick={() => setView("checkout")} aria-label="Carrinho" className="relative grid h-12 w-12 place-items-center rounded-full bg-gold text-primary-foreground shadow-gold">
            <ShoppingCart className="h-5 w-5" />
            {cart > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-foreground text-xs font-bold text-background">{cart}</span>}
          </button>
        </div>
        <div className={`mx-auto max-w-6xl overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-in-out ${menuOpen ? "mt-4 max-h-64 opacity-100" : "mt-0 max-h-0 opacity-0 pointer-events-none"}`} aria-hidden={!menuOpen}>
          <nav className="flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#25282d] text-white shadow-xl" aria-label="Menu de navegação">
            <button type="button" className="border-b border-white/10 px-6 py-4 text-left font-semibold hover:bg-white/10" onClick={() => { setMenuOpen(false); setView("home"); window.scrollTo(0, 0); }}>Início</button>
            <button type="button" className="border-b border-white/10 px-6 py-4 text-left font-semibold hover:bg-white/10" onClick={() => { setMenuOpen(false); setView("support"); window.scrollTo(0, 0); }}>Suporte</button>
            <button type="button" className="px-6 py-4 text-left font-semibold hover:bg-white/10" onClick={() => { setMenuOpen(false); document.getElementById("politicas-kingdom")?.scrollIntoView({ behavior: "smooth" }); }}>Termos</button>
          </nav>
        </div>
        <div className="mx-auto mt-4 flex max-w-6xl items-center rounded-full border border-border bg-muted pl-5 pr-1.5">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produtos..." className="flex-1 bg-transparent py-3 outline-none placeholder:text-muted-foreground" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-primary-foreground"><Search className="h-5 w-5" /></span>
        </div>
      </header>

      {view === "support" ? (
        <SupportPage />
      ) : view !== "home" ? (
        <Checkout view={view} setView={setView} items={items} setItems={setItems} onAdd={add} />
      ) : (<>

      <img src="/images/banner-prata.jpg?v=promocional-prata-20261029" alt="Kingdom Robux prata" className="mx-auto block w-full max-w-6xl h-auto" />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-4xl font-extrabold text-gold-grad">Promoções</h2>
        <div className="mt-2 h-1 w-48 rounded-full bg-gold" />
        <div ref={productScrollRef} onScroll={loopProductScroll} className="-mx-4 mt-8 flex gap-5 overflow-x-auto px-4 pb-4">
          {(list.length ? [0, 1, 2].flatMap((copy) => list.map((p) => ({ p, copy }))) : []).map(({ p, copy }) => <ProductCard key={`${copy}-${p.amount}`} p={p} onAdd={() => add(p.amount)} />)}
          {list.length === 0 && <p className="text-muted-foreground">Nenhum produto encontrado.</p>}
        </div>

        <section className="mt-16 text-center">
          <h2 className="font-display text-3xl font-extrabold">
            Somos quase <span className="text-gold-grad">200 mil seguidores</span>
          </h2>
          <div className="mx-auto mt-3 h-1 w-64 rounded-full bg-gold" />
          <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
            Venha fazer parte da nossa comunidade. O que você está esperando?
          </p>
          <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-2xl border-2 border-primary">
            <img src="https://i.postimg.cc/DZpq2P56/file-000000007ec0820e8028a62b890adbbb.png" alt="Perfil Kingdom Robux" className="block h-auto w-full" loading="lazy" />
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-4xl font-extrabold text-gold-grad">Últimas avaliações</h2>
          <div className="mt-2 h-1 w-48 rounded-full bg-gold" />
          <div className="-mx-4 mt-8 flex snap-x gap-5 overflow-x-auto px-4 pb-4">
            {reviews.map((r) => (
              <div key={r.name} className="min-h-56 w-72 shrink-0 snap-start rounded-3xl border border-border bg-card p-6 shadow-gold">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-bold">{r.name}</p>
                  <div className="flex text-primary">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">{r.text}</p>
                {r.img && <img src={r.img} alt={`Robux recebidos por ${r.name}`} loading="lazy" className="mt-4 aspect-[4/3] w-full rounded-2xl border border-border object-cover" />}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center font-display text-5xl font-extrabold text-gold-grad">Perguntas Frequentes</h2>
          <div className="mx-auto mt-3 h-1 w-64 rounded-full bg-gold" />
          <div className="mx-auto mt-8 max-w-3xl space-y-5">
            {faqs.map((f) => <Faq key={f.q} {...f} />)}
          </div>
        </section>
      </main>
      </>)}

      <footer className="border-t-2 border-primary/60 px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          <Logo big />
          <div>
            <h4 className="font-bold tracking-widest text-primary">ATENDIMENTO AO CLIENTE</h4>
            <p className="mt-4 flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> suporte@kingdomrobux.com</p>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-4 w-4" /> Discord</p>
          </div>
          <div>
            <h4 id="politicas-kingdom" className="font-bold tracking-widest text-primary">POLÍTICAS</h4>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              <li>Sobre nós</li><li>Termos de serviço</li><li>Política de reembolso</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

type Items = Record<number, number>;
function Checkout({ view, setView, items, setItems, onAdd }: { view: "checkout" | "pix"; setView: (v: "home" | "checkout" | "pix") => void; items: Items; setItems: (f: (i: Items) => Items) => void; onAdd: (a: number) => void }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [pixError, setPixError] = useState("");
  const [payment, setPayment] = useState<{id:string;code:string;qr:string;amount:number}|null>(null);
  const [paid, setPaid] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [msg, setMsg] = useState("");
  const lines = products.filter((p) => items[p.amount]);
  const subtotal = lines.reduce((t, p) => t + p.price * (items[p.amount] ?? 0), 0);
  const total = subtotal * (1 - discount);
  const setQty = (a: number, d: number) => setItems((it) => { const n = { ...it, [a]: (it[a] || 0) + d }; if ((n[a] ?? 0) <= 0) delete n[a]; return n; });
  const api = "https://flevopay-api.lcfferr57.workers.dev";
  async function generatePix() {
    if (loadingPix || !username.trim() || !lines.length || !acceptedTerms) return;
    setLoadingPix(true);
    setPixError("");
    try {
      const response = await fetch(api + "/api/create-pix", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email: email.trim(), username: username.trim(),
          amount: Number(total.toFixed(2)),
          product: lines.map(p => String(p.amount) + " Robux x" + String(items[p.amount])).join(", "),
          source: "kingdom-robux-new"
        })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || "Não foi possível gerar o Pix.");
      const id = String(data.paymentId || data.reference || data.transactionId || "");
      const code = String(data.copyPaste || data.pixCode || "");
      const qr = String(data.qrcodeUrl || data.qrCodeUrl || "");
      if (!id || (!code && !qr)) throw new Error("O servidor não retornou um Pix válido.");
      setPayment({id, code, qr, amount:total});
      setPaid(false);
      setView("pix");
      window.scrollTo(0,0);
    } catch (error) {
      setPixError(error instanceof Error ? error.message : "Falha ao gerar Pix.");
    } finally { setLoadingPix(false); }
  }
  useEffect(() => {
    if (view !== "pix" || !payment || paid) return;
    let active = true;
    async function check() {
      try {
        const response = await fetch(api + "/api/status-pix?paymentId=" + encodeURIComponent(payment!.id), {cache:"no-store"});
        if (!response.ok) return;
        const data = await response.json();
        const status = String(data.status || data.paymentStatus || data.payment_status || data.state || "").toUpperCase();
        if (
  active &&
  (data.paid === true ||
    ["APPROVED", "PAID", "COMPLETED", "CONFIRMED", "SUCCESS", "SUCCEEDED"].includes(status))
) {
  setPaid(true);
  try {
    const originalPurchase = JSON.stringify({
      paymentId: payment!.id,
      email: email.trim(),
      username: username.trim(),
      name: username.trim(),
      amount: payment!.amount
    });
    window.sessionStorage.setItem("kingdom_original_purchase", originalPurchase);
    window.localStorage.setItem("kingdom_original_purchase", originalPurchase);
  } catch (storageError) {
    console.error("Não foi possível salvar os dados do pedido para o upsell:", storageError);
  }
  window.location.assign("/upsell.html");
        }
      } catch (error) { console.error("Consulta Pix:",error); }
    }
    void check();
    const interval = window.setInterval(check, 4000);
    return () => {active = false; window.clearInterval(interval);};
  }, [view, payment?.id, paid]);
  const card = "rounded-3xl border border-border bg-card p-6 shadow-gold";

  if (view === "pix") {
    if (!payment) return <main className="mx-auto max-w-xl p-8"><p>Nenhuma cobrança gerada.</p><button onClick={() => setView("checkout")}>Voltar</button></main>;
    const qrSource = payment.qr || (payment.code ? "https://quickchart.io/qr?size=240&margin=2&text=" + encodeURIComponent(payment.code) : "");
    return (
      <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
        <div className={card + " text-center"}>
          <h2 className="font-display text-2xl font-extrabold">Pague {brl(payment.amount)} via PIX</h2>
          {qrSource && <img src={qrSource} alt="QR Code Pix" className="mx-auto mt-5 h-56 w-56 rounded-xl bg-white p-3" />}
          {payment.code && <>
            <p className="mt-4 break-all rounded-xl bg-muted p-3 text-xs text-muted-foreground">{payment.code}</p>
            <button onClick={() => navigator.clipboard?.writeText(payment.code)} className="mt-3 w-full rounded-full bg-gold py-3 font-bold text-primary-foreground">Copiar código PIX</button>
          </>}
        </div>
        <div className={card}>
          <h3 className="text-center text-lg font-bold">Como pagar:</h3>
          <ol className="mt-5 space-y-4">
            {["Abra o app do seu banco", "Escaneie o QR Code ou cole o código PIX", "Confirme o pagamento no seu banco", "Aguarde a confirmação automática"].map((t, i) => (
              <li key={t} className="flex items-center gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold font-bold text-primary-foreground">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
        <div className={card + " text-center"}>
          {paid ? <p className="font-bold text-success">Pagamento confirmado! Identificador: {payment.id}</p> :
            <p className="flex items-center justify-center gap-3 text-primary"><Loader2 className="h-5 w-5 animate-spin" /> Aguardando confirmação do pagamento...</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <nav aria-label="Etapas da compra" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)_auto_minmax(0,1.15fr)] items-center gap-1 rounded-2xl border border-border bg-card px-2 py-5 shadow-gold sm:gap-3 sm:px-5">
        <div className="flex min-w-0 items-center justify-center gap-1 text-[10px] font-semibold sm:gap-2 sm:text-sm">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold text-primary-foreground sm:h-9 sm:w-9"><Check className="h-4 w-4 sm:h-5 sm:w-5" /></span>
          <span>Pacote</span>
        </div>
        <span className="h-px w-2 bg-border sm:w-5" />
        <div className="flex min-w-0 items-center justify-center gap-1 text-[10px] font-bold sm:gap-2 sm:text-sm" aria-current="step">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold bg-gold/15 text-gold sm:h-9 sm:w-9">2</span>
          <span>Seus dados</span>
        </div>
        <span className="h-px w-2 bg-border sm:w-5" />
        <div className="flex min-w-0 items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground sm:gap-2 sm:text-sm">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border sm:h-9 sm:w-9">3</span>
          <span className="min-w-0 break-words">Pagamento</span>
        </div>
      </nav>
      <div className={card}>
        <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold"><User className="h-6 w-6" /> Seus Dados</h2>
        <label className="mt-5 block text-muted-foreground">Email *</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-2 w-full rounded-xl border border-border bg-muted px-4 py-3 outline-none focus:border-primary" />
        <label className="mt-5 block text-muted-foreground">Usuário Roblox *</label>
        <input autoComplete="off" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Digite seu usuário Roblox" className="mt-2 w-full rounded-xl border border-border bg-muted px-4 py-3 outline-none transition-colors duration-200 focus:border-primary" />
      </div>
      <div className={card}>
        <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold"><Lock className="h-6 w-6" /> Seus Produtos ({lines.length})</h2>
        <div className="mt-4 flex justify-center"><span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 px-5 py-2 text-center font-display text-sm font-black uppercase tracking-wide text-zinc-950 shadow-lg shadow-cyan-500/20">✦ ENTREGA AUTOMÁTICA ✦</span></div>
        {lines.length === 0 && <p className="mt-4 text-muted-foreground">Seu carrinho está vazio.</p>}
        {lines.map((p) => (
          <div key={p.amount} className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-muted p-3">
            <img src={p.img} alt="" className="h-16 w-12 rounded-lg object-cover" />
            <div className="flex-1"><p className="font-bold">{p.amount.toLocaleString("pt-BR")} ROBUX</p><p className="text-primary">{brl(p.price)}</p></div>
            <button aria-label="Menos" onClick={() => setQty(p.amount, -1)} className="grid h-8 w-8 place-items-center rounded-full bg-destructive text-destructive-foreground"><Minus className="h-4 w-4" /></button>
            <span className="w-5 text-center font-bold">{items[p.amount]}</span>
            <button aria-label="Mais" onClick={() => setQty(p.amount, 1)} className="grid h-8 w-8 place-items-center rounded-full bg-success text-success-foreground"><Plus className="h-4 w-4" /></button>
            <button aria-label="Remover" onClick={() => setQty(p.amount, -(items[p.amount] ?? 0))} className="grid h-8 w-8 place-items-center rounded-full bg-background"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}

      </div>
      <div className={card}>
        <h2 className="font-display text-2xl font-extrabold">Resumo do Pedido</h2>
        <div className="mt-5 flex justify-between text-muted-foreground"><span>Subtotal:</span><span className="text-primary">{brl(subtotal)}</span></div>
        {discount > 0 && <div className="mt-2 flex justify-between text-muted-foreground"><span>Cupom (10%):</span><span>-{brl(subtotal * discount)}</span></div>}
        <div className="my-4 h-px bg-border" />
        <div className="flex justify-between font-display text-3xl font-extrabold"><span>Total:</span><span className="text-gold-grad">{brl(total)}</span></div>
        <div className="mt-5 flex gap-3">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Código do cupom" className="min-w-0 flex-1 rounded-xl border border-border bg-muted px-4 py-3 outline-none" />
          <button onClick={() => { const ok = coupon.trim().toUpperCase() === "ROBUXBARATO"; setDiscount(ok ? 0.1 : 0); setMsg(ok ? "Cupom aplicado: 10% OFF!" : "Cupom inválido"); }} className="rounded-xl bg-gold px-5 font-bold text-primary-foreground">Aplicar</button>
        </div>
        {msg && <p className="mt-2 text-sm text-primary">{msg}</p>}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-bold">Forma de pagamento</h3>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-400/60 bg-muted/70 p-4">
            <img src="https://i.postimg.cc/7PSMjd2t/1793328092385.png" alt="Ícone PIX" className="h-14 w-14 shrink-0 rounded-xl object-contain" />
            <div>
              <p className="font-bold">Pagamento instantâneo via PIX</p>
              <p className="mt-1 text-sm text-muted-foreground">QR Code e Pix Copia e Cola gerados na hora.</p>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-slate-400" />
            <span>Li e aceito os <a href="/#politicas-kingdom" target="_blank" rel="noopener noreferrer" className="text-foreground underline">termos</a> e a <a href="/#politicas-kingdom" target="_blank" rel="noopener noreferrer" className="text-foreground underline">política de privacidade</a>.</span>
          </label>
        </div>
        <button disabled={!acceptedTerms || loadingPix || !lines.length || !username.trim() || !/\S+@\S+\.\S+/.test(email)} onClick={generatePix} className="mt-5 w-full rounded-full bg-gold py-4 font-display text-lg font-extrabold text-primary-foreground disabled:opacity-50">{loadingPix ? "GERANDO PIX..." : "FINALIZAR COMPRA"}</button>
        {pixError && <p role="alert" className="mt-3 text-center text-destructive">{pixError}</p>}
        {lines.length > 0 && !/\S+@\S+\.\S+/.test(email) && <p className="mt-2 text-center text-sm text-muted-foreground">Preencha seu email para continuar</p>}
      </div>
      <section className="pt-6">
        <h2 className="text-center font-display text-3xl font-extrabold text-gold-grad">VOCÊ TAMBÉM PODE GOSTAR</h2>
        <div className="mx-auto mt-3 h-1 w-40 rounded-full bg-gold" />
        <div className="-mx-4 mt-6 flex snap-x gap-5 overflow-x-auto px-4 pb-4">
          {products.map((p) => <ProductCard key={p.amount} p={p} onAdd={() => onAdd(p.amount)} />)}
        </div>
      </section>
    </main>
  );
}
