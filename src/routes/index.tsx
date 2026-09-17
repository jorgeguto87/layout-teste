import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  ImagePlus,
  Info,
  Link as LinkIcon,
  PackageOpen,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Editar produto | Eu Cardápio" },
      {
        name: "description",
        content: "Cadastre produtos, preços, variantes, opcionais e adicionais no Eu Cardápio.",
      },
      { property: "og:title", content: "Editar produto | Eu Cardápio" },
      {
        property: "og:description",
        content: "Configure todos os detalhes de um produto do seu cardápio em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductEditor,
});

type VariantOption = { id: number; name: string; price: string };
type VariantGroup = { id: number; question: string; options: VariantOption[] };
type FreeItem = { id: number; name: string; checked: boolean };
type PaidItem = { id: number; name: string; price: string; checked: boolean };
type FreeCategory = {
  id: number;
  name: string;
  icon: string;
  min: number;
  max: number;
  items: FreeItem[];
};

const startingGroups: VariantGroup[] = [
  {
    id: 1,
    question: "Qual tamanho?",
    options: [
      { id: 11, name: "500 ml", price: "18,00" },
      { id: 12, name: "750 ml", price: "24,00" },
    ],
  },
  {
    id: 2,
    question: "Qual tipo de carne?",
    options: [
      { id: 21, name: "Carne bovina", price: "22,00" },
      { id: 22, name: "Frango grelhado", price: "20,00" },
    ],
  },
];

const startingFree: FreeCategory[] = [
  {
    id: 1,
    name: "Proteínas",
    icon: "🍗",
    min: 1,
    max: 2,
    items: [
      { id: 1, name: "Frango grelhado", checked: true },
      { id: 2, name: "Carne de panela", checked: true },
      { id: 3, name: "Ovo frito", checked: true },
      { id: 4, name: "Linguiça acebolada", checked: false },
    ],
  },
  {
    id: 2,
    name: "Acompanhamentos",
    icon: "🥗",
    min: 2,
    max: 3,
    items: [
      { id: 5, name: "Arroz branco", checked: true },
      { id: 6, name: "Feijão carioca", checked: true },
      { id: 7, name: "Farofa", checked: true },
      { id: 8, name: "Salada do dia", checked: true },
    ],
  },
  {
    id: 3,
    name: "Molhos",
    icon: "🥣",
    min: 0,
    max: 1,
    items: [
      { id: 9, name: "Molho da casa", checked: true },
      { id: 10, name: "Molho picante", checked: true },
    ],
  },
];

const startingPaid: PaidItem[] = [
  { id: 1, name: "Bacon extra", price: "4,00", checked: true },
  { id: 2, name: "Queijo extra", price: "3,50", checked: true },
  { id: 3, name: "Ovo extra", price: "2,50", checked: false },
];

function quantityCopy(min: number, max: number) {
  if (min === max) return `Escolha exatamente ${min}`;
  if (min === 0) return `Escolha até ${max} (opcional)`;
  return `Escolha de ${min} a ${max}`;
}

function SectionTitle({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="mb-6 flex gap-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </span>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function ProductEditor() {
  const [editing, setEditing] = useState(true);
  const [productName, setProductName] = useState("Marmitex da Casa");
  const [description, setDescription] = useState(
    "Monte sua marmitex do seu jeito, com ingredientes frescos e preparo caseiro.",
  );
  const [categories, setCategories] = useState(["Marmitex", "Lanches", "Bebidas", "Sobremesas"]);
  const [category, setCategory] = useState("Marmitex");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [priceMode, setPriceMode] = useState<"simple" | "variants">("variants");
  const [simplePrice, setSimplePrice] = useState("24,00");
  const [groups, setGroups] = useState(startingGroups);
  const [freeCategories, setFreeCategories] = useState(startingFree);
  const [paidItems, setPaidItems] = useState(startingPaid);
  const [choiceTab, setChoiceTab] = useState<"free" | "paid">("free");
  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(1);
  const [variantRules, setVariantRules] = useState(false);
  const [variantRule, setVariantRule] = useState({ min: 1, max: 3 });
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragged, setDragged] = useState<{ groupId: number; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const lowestPrice = useMemo(() => {
    const values = groups.flatMap((group) =>
      group.options.map((option) => Number(option.price.replace(".", "").replace(",", "."))),
    );
    const valid = values.filter((value) => Number.isFinite(value) && value > 0);
    return valid.length ? Math.min(...valid).toFixed(2).replace(".", ",") : "0,00";
  }, [groups]);

  const addCategory = () => {
    const clean = newCategory.trim();
    if (!clean) return;
    setCategories((current) => [...current, clean]);
    setCategory(clean);
    setNewCategory("");
    setAddingCategory(false);
  };

  const addGroup = (question = "") => {
    const id = Date.now();
    setGroups((current) => [
      ...current,
      { id, question, options: [{ id: id + 1, name: "", price: "" }] },
    ]);
    setReuseOpen(false);
  };

  const updateGroup = (groupId: number, patch: Partial<VariantGroup>) => {
    setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)));
  };

  const updateOption = (groupId: number, optionId: number, field: "name" | "price", value: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option,
              ),
            }
          : group,
      ),
    );
  };

  const addOption = (groupId: number) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, options: [...group.options, { id: Date.now(), name: "", price: "" }] }
          : group,
      ),
    );
  };

  const removeOption = (groupId: number, optionId: number) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, options: group.options.filter((option) => option.id !== optionId) }
          : group,
      ),
    );
  };

  const reorderOption = (groupId: number, targetIndex: number) => {
    if (!dragged || dragged.groupId !== groupId || dragged.index === targetIndex) return;
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const next = [...group.options];
        const [moved] = next.splice(dragged.index, 1);
        if (!moved) return group;
        next.splice(targetIndex, 0, moved);
        return { ...group, options: next };
      }),
    );
    setDragged(null);
  };

  const updateFreeCategory = (id: number, updater: (item: FreeCategory) => FreeCategory) => {
    setFreeCategories((current) => current.map((item) => (item.id === id ? updater(item) : item)));
  };

  const applyFavorite = () => {
    setFreeCategories(startingFree.map((item) => ({ ...item, items: item.items.map((child) => ({ ...child, checked: true })) })));
    setPaidItems(startingPaid.map((item) => ({ ...item, checked: true })));
    setFavoriteOpen(false);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Voltar">
              <ArrowLeft />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-bold text-primary sm:inline">EU CARDÁPIO</span>
                <span className="hidden text-border sm:inline">/</span>
                <span className="truncate text-sm font-semibold">{editing ? "Editar produto" : "Novo produto"}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{productName || "Produto sem nome"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <Checkbox checked={editing} onCheckedChange={(value) => setEditing(Boolean(value))} />
              Simular edição
            </label>
            {editing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="hidden text-destructive hover:text-destructive sm:inline-flex">
                    <Trash2 /> Remover
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover este produto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      “{productName}” deixará de aparecer no cardápio. Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Remover produto
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={save} className="min-w-32">
              {saved ? <Check /> : <Save />}
              <span className="hidden sm:inline">{saved ? "Salvo!" : editing ? "Salvar alterações" : "Adicionar ao cardápio"}</span>
              <span className="sm:hidden">{saved ? "Salvo" : "Salvar"}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1" aria-label="Seções do produto">
            {[
              ["01", "Produto", "#produto"],
              ["02", "Preço", "#preco"],
              ["03", "Escolhas", "#escolhas"],
              ["04", "Imagem", "#imagem"],
            ].map(([number, label, href], index) => (
              <a
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition-colors hover:bg-accent",
                  index === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <span className="font-mono text-xs text-primary">{number}</span>{label}
              </a>
            ))}
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-success">
                <span className="size-2 rounded-full bg-success" /> Alterações salvas
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Os campos ficam reunidos por assunto para você revisar sem pressa.</p>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 space-y-7">
          <section id="produto" className="editor-section scroll-mt-24">
            <SectionTitle number="1" title="Sobre o produto" text="O que o cliente verá primeiro no cardápio." />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="field-label md:col-span-2">
                Nome do produto
                <Input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Ex.: Marmitex da Casa" />
              </label>
              <label className="field-label md:col-span-2">
                Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Conte o que acompanha e por que vale a pena pedir" />
                <span className="text-right text-xs font-normal text-muted-foreground">{description.length}/300</span>
              </label>
              <div className="md:col-span-2">
                <p className="field-label">Em qual categoria ele aparece?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <Button key={item} type="button" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)}>
                      {category === item && <Check />}{item}
                    </Button>
                  ))}
                  {!addingCategory && <Button type="button" variant="ghost" onClick={() => setAddingCategory(true)}><Plus /> Criar categoria</Button>}
                </div>
                {addingCategory && (
                  <div className="mt-3 flex max-w-md gap-2 rounded-md border border-primary/25 bg-primary-soft p-2">
                    <Input autoFocus value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addCategory()} placeholder="Nome da nova categoria" />
                    <Button onClick={addCategory}>Criar</Button>
                    <Button variant="ghost" size="icon" onClick={() => setAddingCategory(false)} aria-label="Cancelar"><X /></Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="preco" className="editor-section scroll-mt-24">
            <SectionTitle number="2" title="Como este produto é vendido?" text="Use um valor único ou ofereça versões diferentes." />
            <div className="mb-6 grid grid-cols-2 rounded-md bg-muted p-1">
              <Button variant={priceMode === "simple" ? "secondary" : "ghost"} className={cn("h-auto flex-col items-start gap-1 px-4 py-3 shadow-none", priceMode === "simple" && "bg-card") } onClick={() => setPriceMode("simple") }>
                <span className="font-bold">Preço simples</span><span className="text-xs font-normal text-muted-foreground">Um único valor</span>
              </Button>
              <Button variant={priceMode === "variants" ? "secondary" : "ghost"} className={cn("h-auto flex-col items-start gap-1 px-4 py-3 shadow-none", priceMode === "variants" && "bg-card") } onClick={() => setPriceMode("variants") }>
                <span className="font-bold">Com variantes</span><span className="text-xs font-normal text-muted-foreground">Tamanhos, tipos e mais</span>
              </Button>
            </div>

            {priceMode === "simple" ? (
              <label className="field-label max-w-xs">Preço final ao cliente<div className="relative mt-2"><span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span><Input className="pl-10 text-lg font-bold" value={simplePrice} onChange={(event) => setSimplePrice(event.target.value)} /></div></label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md border border-info-border bg-info-soft p-4 text-sm">
                  <Info className="mt-0.5 size-4 shrink-0 text-info" />
                  <p><strong>O preço de cada opção já é o valor final.</strong> No cardápio, o cliente verá “a partir de R$ {lowestPrice}”.</p>
                </div>
                {groups.map((group, groupIndex) => (
                  <article key={group.id} className="variant-group">
                    <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
                      <div className="min-w-0 flex-1">
                        <span className="eyebrow">Grupo {groupIndex + 1}</span>
                        <Input className="mt-1 border-0 px-0 text-base font-bold shadow-none focus-visible:ring-0" value={group.question} onChange={(event) => updateGroup(group.id, { question: event.target.value })} placeholder="Ex.: Qual tamanho?" aria-label={`Nome do grupo ${groupIndex + 1}`} />
                        <p className="text-xs text-muted-foreground">Essa é a pergunta que o cliente verá.</p>
                      </div>
                      <Button variant="ghost" size="icon" aria-label="Excluir grupo" onClick={() => setGroups((current) => current.filter((item) => item.id !== group.id))}><Trash2 /></Button>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="mb-2 hidden grid-cols-[24px_1fr_150px_40px] gap-2 px-1 text-xs font-semibold text-muted-foreground sm:grid"><span /><span>Nome da opção</span><span>Preço final</span><span /></div>
                      <div className="space-y-2">
                        {group.options.map((option, optionIndex) => (
                          <div key={option.id} draggable onDragStart={() => setDragged({ groupId: group.id, index: optionIndex })} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderOption(group.id, optionIndex)} className="grid grid-cols-[24px_1fr_96px_36px] items-center gap-2 rounded-md border border-border bg-card p-2 sm:grid-cols-[24px_1fr_150px_40px]">
                            <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                            <Input className="border-0 shadow-none" value={option.name} onChange={(event) => updateOption(group.id, option.id, "name", event.target.value)} placeholder="Ex.: 500 ml" aria-label="Nome da opção" />
                            <div className="relative"><span className="absolute left-2 top-2.5 text-xs text-muted-foreground">R$</span><Input className="pl-8 font-semibold" value={option.price} onChange={(event) => updateOption(group.id, option.id, "price", event.target.value)} placeholder="0,00" aria-label="Preço final" /></div>
                            <Button variant="ghost" size="icon" aria-label="Remover opção" onClick={() => removeOption(group.id, option.id)}><X /></Button>
                            {groupIndex === 0 && (
                              <button type="button" onClick={() => setVariantRules(true)} className="col-start-2 col-span-3 flex w-fit items-center gap-1 text-left text-xs font-semibold text-primary hover:underline">
                                <Sparkles className="size-3" /> Personalizar quantas escolhas “{option.name || "esta opção"}” permite
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" className="mt-3" onClick={() => addOption(group.id)}><Plus /> Adicionar opção</Button>
                    </div>
                  </article>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => addGroup()}><Plus /> Novo grupo</Button>
                  <div className="relative">
                    <Button variant="outline" onClick={() => setReuseOpen((open) => !open)}><Copy /> Reaproveitar grupo <ChevronDown /></Button>
                    {reuseOpen && (
                      <div className="absolute left-0 top-11 z-20 w-72 rounded-md border border-border bg-popover p-2 shadow-lg">
                        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">COPIA APENAS OS NOMES</p>
                        {[
                          ["Ponto da carne", "Malpassada, ao ponto, bem passada"],
                          ["Tipo de massa", "Tradicional, integral, sem glúten"],
                        ].map(([title, subtitle]) => (
                          <button key={title} type="button" onClick={() => addGroup(title)} className="block w-full rounded-md px-2 py-2 text-left hover:bg-accent"><span className="block text-sm font-semibold">{title}</span><span className="text-xs text-muted-foreground">{subtitle}</span></button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section id="escolhas" className="editor-section scroll-mt-24">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <SectionTitle number="3" title="O que o cliente pode escolher?" text="Vincule itens da sua lista e defina regras claras." />
              <div className="relative shrink-0">
                <Button variant="outline" onClick={() => setFavoriteOpen((open) => !open)}><Sparkles className="text-primary" /> Aplicar favorito <ChevronDown /></Button>
                {favoriteOpen && (
                  <div className="absolute right-0 top-11 z-20 w-72 rounded-md border border-border bg-popover p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">PACOTES SALVOS</p>
                    <button type="button" onClick={applyFavorite} className="block w-full rounded-md px-2 py-2 text-left hover:bg-accent"><span className="block text-sm font-semibold">Marmitex completo</span><span className="text-xs text-muted-foreground">3 categorias · 7 itens · 3 adicionais</span></button>
                    <button type="button" onClick={applyFavorite} className="block w-full rounded-md px-2 py-2 text-left hover:bg-accent"><span className="block text-sm font-semibold">Lanche padrão</span><span className="text-xs text-muted-foreground">2 categorias · 5 itens · 2 adicionais</span></button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-5 flex gap-6 border-b border-border">
              <button type="button" onClick={() => setChoiceTab("free")} className={cn("choice-tab", choiceTab === "free" && "choice-tab-active")}><span>Opcionais grátis</span><span className="choice-count">{freeCategories.length}</span></button>
              <button type="button" onClick={() => setChoiceTab("paid")} className={cn("choice-tab", choiceTab === "paid" && "choice-tab-active")}><span>Adicionais pagos</span><span className="choice-count">{paidItems.filter((item) => item.checked).length}</span></button>
            </div>

            {choiceTab === "free" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md bg-muted p-4 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><p>Opcionais já fazem parte do produto e não têm custo extra. Em cada categoria, escolha os itens oferecidos e quantos o cliente pode selecionar.</p></div>
                {freeCategories.map((freeCategory) => {
                  const selected = freeCategory.items.filter((item) => item.checked).length;
                  const allSelected = selected === freeCategory.items.length;
                  const open = expandedCategory === freeCategory.id;
                  return (
                    <article key={freeCategory.id} className={cn("option-category", open && "option-category-open") }>
                      <button type="button" onClick={() => setExpandedCategory(open ? null : freeCategory.id)} className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5">
                        <div className="flex min-w-0 items-center gap-3"><span className="text-2xl" aria-hidden="true">{freeCategory.icon}</span><div><h3 className="font-bold">{freeCategory.name}</h3><p className="mt-0.5 text-xs text-muted-foreground">{selected} de {freeCategory.items.length} itens disponíveis</p></div></div>
                        <div className="flex items-center gap-3"><span className="hidden rounded-md bg-rule px-3 py-1.5 text-xs font-bold text-rule-foreground sm:inline">{quantityCopy(freeCategory.min, freeCategory.max)}</span><ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} /></div>
                      </button>
                      {open && (
                        <div className="border-t border-border p-4 sm:p-5">
                          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
                            <div>
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><Checkbox checked={allSelected} onCheckedChange={(value) => updateFreeCategory(freeCategory.id, (current) => ({ ...current, items: current.items.map((item) => ({ ...item, checked: Boolean(value) })) }))} /> Marcar todos</label>
                                <Button variant="ghost" size="sm" onClick={() => updateFreeCategory(freeCategory.id, (current) => current.items.some((item) => item.name === "Não precisa") ? current : ({ ...current, items: [...current.items, { id: Date.now(), name: "Não precisa", checked: true }] }))}><Plus /> Adicionar “Não precisa”</Button>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {freeCategory.items.map((item) => (
                                  <label key={item.id} className={cn("item-check", item.checked && "item-check-active")}><Checkbox checked={item.checked} onCheckedChange={(value) => updateFreeCategory(freeCategory.id, (current) => ({ ...current, items: current.items.map((child) => child.id === item.id ? { ...child, checked: Boolean(value) } : child) }))} /><span>{item.name}</span></label>
                                ))}
                              </div>
                            </div>
                            <div className="rule-panel">
                              <p className="text-sm font-bold">Quantos o cliente escolhe?</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">Esta regra vale para os itens marcados ao lado.</p>
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <label className="text-xs font-semibold text-muted-foreground">Mínimo<Input type="number" min={0} max={freeCategory.max} className="mt-1 bg-card text-center text-base font-bold" value={freeCategory.min} onChange={(event) => updateFreeCategory(freeCategory.id, (current) => ({ ...current, min: Number(event.target.value) }))} /></label>
                                <label className="text-xs font-semibold text-muted-foreground">Máximo<Input type="number" min={1} className="mt-1 bg-card text-center text-base font-bold" value={freeCategory.max} onChange={(event) => updateFreeCategory(freeCategory.id, (current) => ({ ...current, max: Number(event.target.value) }))} /></label>
                              </div>
                              <div className="mt-4 rounded-md bg-rule-strong p-3 text-center text-sm font-bold text-rule-foreground">{quantityCopy(freeCategory.min, freeCategory.max)}</div>
                              {priceMode === "variants" && freeCategory.id === 1 && (
                                <button type="button" onClick={() => setVariantRules(true)} className="mt-3 flex w-full items-center justify-between rounded-md border border-primary/20 bg-card px-3 py-2 text-left text-xs font-semibold text-primary"><span>1 regra diferente por tamanho</span><span>Editar</span></button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
                <Button variant="outline"><Plus /> Vincular outra categoria</Button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-start gap-3 rounded-md bg-muted p-4 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><p>O cliente pode adicionar quantas unidades quiser, inclusive nenhuma. Cada item soma o valor indicado ao pedido.</p></div>
                <article className="option-category option-category-open p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Extras</h3><p className="text-xs text-muted-foreground">Escolha quais adicionais estarão disponíveis</p></div><label className="flex items-center gap-2 text-sm font-semibold"><Checkbox checked={paidItems.every((item) => item.checked)} onCheckedChange={(value) => setPaidItems((current) => current.map((item) => ({ ...item, checked: Boolean(value) })))} /> Marcar todos</label></div>
                  <div className="space-y-2">
                    {paidItems.map((item) => (
                      <label key={item.id} className={cn("grid grid-cols-[auto_1fr_110px] items-center gap-3 rounded-md border p-3", item.checked ? "border-primary/30 bg-primary-soft" : "border-border") }><Checkbox checked={item.checked} onCheckedChange={(value) => setPaidItems((current) => current.map((child) => child.id === item.id ? { ...child, checked: Boolean(value) } : child))} /><span className="text-sm font-semibold">{item.name}</span><div className="relative"><span className="absolute left-2 top-2.5 text-xs text-muted-foreground">R$</span><Input value={item.price} onChange={(event) => setPaidItems((current) => current.map((child) => child.id === item.id ? { ...child, price: event.target.value } : child))} className="bg-card pl-8" /></div></label>
                    ))}
                  </div>
                </article>
                <Button variant="outline" className="mt-4"><Plus /> Vincular outra categoria</Button>
              </div>
            )}
          </section>

          <section id="imagem" className="editor-section scroll-mt-24">
            <SectionTitle number="4" title="Imagem do produto" text="Uma boa foto ajuda o cliente a decidir." />
            <div className="mb-4 flex w-fit rounded-md bg-muted p-1">
              <Button size="sm" variant={imageMode === "upload" ? "secondary" : "ghost"} className={imageMode === "upload" ? "bg-card" : undefined} onClick={() => setImageMode("upload")}><Upload /> Enviar arquivo</Button>
              <Button size="sm" variant={imageMode === "url" ? "secondary" : "ghost"} className={imageMode === "url" ? "bg-card" : undefined} onClick={() => setImageMode("url")}><LinkIcon /> Colar URL</Button>
            </div>
            {imageMode === "upload" ? (
              <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]); }} className="upload-zone">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
                {preview ? <img src={preview} alt="Prévia do produto" className="h-44 w-full object-cover" /> : <><span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary"><ImagePlus /></span><span className="mt-3 font-bold">Clique ou arraste uma foto aqui</span><span className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP · até 5 MB</span></>}
              </button>
            ) : (
              <div className="flex max-w-xl gap-2"><Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://exemplo.com/foto-do-produto.jpg" /><Button variant="outline" onClick={() => setPreview(imageUrl)}>Usar imagem</Button></div>
            )}
          </section>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 pb-10 sm:flex-row sm:items-center">
            {editing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" className="text-destructive hover:text-destructive"><Trash2 /> Remover produto</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover este produto?</AlertDialogTitle><AlertDialogDescription>“{productName}” deixará de aparecer no cardápio. Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground">Remover produto</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            ) : <span />}
            <Button size="lg" onClick={save}>{saved ? <Check /> : <Save />}{saved ? "Tudo salvo!" : editing ? "Salvar alterações" : "Adicionar ao cardápio"}</Button>
          </div>
        </main>
      </div>

      {variantRules && (
        <div className="fixed inset-0 z-50 flex justify-end bg-overlay" onMouseDown={() => setVariantRules(false)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-background p-5 shadow-2xl sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5"><div><span className="eyebrow">EXCEÇÃO POR VARIANTE</span><h2 className="mt-1 text-xl font-bold">Escolhas para “750 ml”</h2><p className="mt-1 text-sm text-muted-foreground">Apenas as quantidades mudam. Os itens continuam os mesmos do produto.</p></div><Button variant="ghost" size="icon" onClick={() => setVariantRules(false)} aria-label="Fechar"><X /></Button></div>
            <div className="my-5 flex gap-3 rounded-md border border-primary/25 bg-primary-soft p-4"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-sm"><strong>Ligado a: Qual tamanho? → 750 ml.</strong><br /><span className="text-muted-foreground">Sem esta exceção, valeria a regra padrão de cada categoria.</span></p></div>
            <div className="rounded-md border border-border">
              <div className="border-b border-border p-4"><h3 className="font-bold">🍗 Proteínas</h3><p className="mt-1 text-xs text-muted-foreground">Mesmos 3 itens marcados no produto</p></div>
              <div className="grid grid-cols-3 gap-2 bg-muted/60 p-4 text-sm">{freeCategories[0]?.items.filter((item) => item.checked).map((item) => <span key={item.id} className="rounded-md bg-card px-2 py-2 text-center shadow-sm">{item.name}</span>)}</div>
              <div className="border-t border-border p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold">Regra só para 750 ml</p><p className="text-xs text-muted-foreground line-through">Padrão: escolha de 1 a 2</p></div><span className="rounded-md bg-rule-strong px-3 py-2 text-xs font-bold text-rule-foreground">{quantityCopy(variantRule.min, variantRule.max)}</span></div><div className="grid grid-cols-2 gap-3"><label className="field-label">Mínimo<Input type="number" min={0} value={variantRule.min} onChange={(event) => setVariantRule((current) => ({ ...current, min: Number(event.target.value) }))} /></label><label className="field-label">Máximo<Input type="number" min={1} value={variantRule.max} onChange={(event) => setVariantRule((current) => ({ ...current, max: Number(event.target.value) }))} /></label></div></div>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-md bg-warning-soft p-4 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><p>O cliente que escolher <strong>750 ml</strong> poderá selecionar até 3 proteínas. Nos outros tamanhos, o limite continua sendo 2.</p></div>
            <div className="mt-8 flex justify-end gap-2"><Button variant="outline" onClick={() => setVariantRules(false)}>Cancelar</Button><Button onClick={() => setVariantRules(false)}><Check /> Aplicar esta regra</Button></div>
          </aside>
        </div>
      )}

      {saved && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-xl"><Check className="size-4" /> Produto salvo com sucesso</div>}
    </div>
  );
}