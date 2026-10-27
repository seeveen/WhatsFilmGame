import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Film,
  Code2,
  Copy,
  Info,
} from 'lucide-react';
import { Challenge } from '../../../../shared/types.ts';
import { ImportValidationResult } from '../../../game/import-validator.ts';

const SAMPLE_JSON_STRUCTURE = `[
  {
    "emoji": "🦁👑🌅",
    "filme": "O Rei Leão",
    "aliases": ["rei leao", "the lion king"],
    "category": "Disney",
    "difficulty": "facil"
  },
  {
    "emoji": "❄️👸⛄",
    "filme": "Frozen",
    "aliases": ["uma aventura congelante"],
    "category": "Disney",
    "difficulty": "facil"
  },
  {
    "emoji": "🕷️🧑🏙️",
    "filme": "Homem-Aranha",
    "aliases": ["spiderman", "homem aranha"],
    "category": "Super-heróis",
    "difficulty": "facil"
  },
  {
    "emoji": "🧽🍍🌊",
    "filme": "Bob Esponja",
    "aliases": ["spongebob"],
    "category": "Desenhos",
    "difficulty": "facil"
  },
  {
    "emoji": "🧙‍♂️💍🌋",
    "filme": "O Senhor dos Anéis",
    "aliases": ["senhor dos aneis", "lotr", "lord of the rings"],
    "category": "Fantasia",
    "difficulty": "medio"
  }
]`;

export const LibraryTab: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);
  const [showDocs, setShowDocs] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  // Single challenge form state
  const [editId, setEditId] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState('');
  const [formFilme, setFormFilme] = useState('');
  const [formCategory, setFormCategory] = useState('Filmes');
  const [formDifficulty, setFormDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [formAliases, setFormAliases] = useState('');

  // Mass JSON Import state
  const [jsonInput, setJsonInput] = useState('');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        search: searchTerm,
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      const res = await fetch(`/api/challenges?${params.toString()}`);
      const data = await res.json();
      setChallenges(data.challenges || []);
      setTotalCount(data.total || 0);
    } catch (e: any) {
      console.error('Failed to load challenges:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [categoryFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchChallenges();
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmoji.trim() || !formFilme.trim()) {
      alert('Emoji e Título do Filme são obrigatórios.');
      return;
    }

    const aliases = formAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const url = editId ? `/api/challenges/${editId}` : '/api/challenges';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emoji: formEmoji.trim(),
          filme: formFilme.trim(),
          category: formCategory,
          difficulty: formDifficulty,
          aliases,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        resetForm();
        setFeedbackMsg({
          type: 'success',
          text: editId ? 'Desafio atualizado com sucesso!' : 'Novo desafio cadastrado!',
        });
        fetchChallenges();
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  const handleDeleteChallenge = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o desafio "${title}"?`)) return;
    try {
      const res = await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Desafio excluído com sucesso.' });
        fetchChallenges();
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormEmoji('');
    setFormFilme('');
    setFormCategory('Filmes');
    setFormDifficulty('medio');
    setFormAliases('');
  };

  const openEditModal = (c: Challenge) => {
    setEditId(c.id);
    setFormEmoji(c.emoji);
    setFormFilme(c.filme);
    setFormCategory(c.category || 'Filmes');
    setFormDifficulty(c.difficulty || 'medio');
    setFormAliases((c.aliases || []).join(', '));
    setIsCreateOpen(true);
  };

  // Mass JSON handlers
  const handleValidateJson = async () => {
    if (!jsonInput.trim()) {
      alert('Cole o JSON ou selecione um arquivo.');
      return;
    }
    setIsValidating(true);
    try {
      const res = await fetch('/api/challenges/validate-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: jsonInput }),
      });
      const data: ImportValidationResult = await res.json();
      setValidationResult(data);
    } catch (e: any) {
      alert(`Falha ao validar JSON: ${e.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validChallenges.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/challenges/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: jsonInput,
          overwriteDuplicates,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `Importação concluída! Inseridos: ${data.inserted}, Atualizados: ${data.updated}, Ignorados: ${data.ignored}`,
        });
        setIsImportOpen(false);
        setJsonInput('');
        setValidationResult(null);
        fetchChallenges();
        setTimeout(() => setFeedbackMsg(null), 5000);
      } else {
        alert(data.error || 'Erro na importação.');
      }
    } catch (e: any) {
      alert(`Erro na requisição: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportJson = () => {
    window.location.href = '/api/challenges/export';
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_JSON_STRUCTURE);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2500);
  };

  const categories = [
    'all',
    'Filmes',
    'Animes',
    'Desenhos',
    'Animações',
    'Disney',
    'Pixar',
    'Séries',
    'Super-heróis',
    'Fantasia',
    'Ficção científica',
  ];

  return (
    <div className="space-y-6 text-[#F7F2F4]">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`px-4 py-3 rounded-lg border text-xs font-semibold animate-in fade-in flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-[#C5163D]/20 border-[#C5163D]/40 text-[#E5254D]'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white font-display flex items-center gap-2.5">
            <Film className="w-6 h-6 text-[#C5163D]" />
            Biblioteca de Desafios
          </h2>
          <p className="text-xs text-[#B7A8AE] mt-1">
            Total de <strong>{totalCount}</strong> desafios cadastrados para sorteio no jogo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#C5163D] hover:bg-[#E5254D] text-white text-xs font-bold transition-all shadow-lg shadow-[#C5163D]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Desafio
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-[#E5254D]" />
            Importar JSON em Massa
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-[#B7A8AE] hover:text-white text-xs font-semibold transition-all cursor-pointer"
            title="Baixar toda a biblioteca em arquivo JSON"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>

          <button
            onClick={() => setShowDocs(!showDocs)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              showDocs
                ? 'bg-[#C5163D]/20 border-[#C5163D] text-[#E5254D]'
                : 'bg-[#21171B] border-[#39272E] text-[#B7A8AE]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            {showDocs ? 'Ocultar Guia JSON' : 'Ver Guia JSON'}
          </button>
        </div>
      </div>

      {/* JSON Schema & Fields Reference Card */}
      {showDocs && (
        <div className="p-6 rounded-lg bg-[#1C171A] border border-[#39272E] shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#39272E]">
            <div className="flex items-center gap-2.5">
              <Code2 className="w-5 h-5 text-[#C5163D]" />
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                Como Estruturar o JSON de Importação
              </h3>
            </div>
            <button
              onClick={handleCopySample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              {copiedSample ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copiar Modelo JSON</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Left: Fields Explanation */}
            <div className="space-y-3">
              <h4 className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#E5254D]" />
                Campos Suportados em Cada Objeto:
              </h4>

              <div className="space-y-2">
                <div className="p-2.5 rounded-md bg-[#110F11] border border-[#39272E]/60">
                  <span className="font-mono-num font-bold text-[#E5254D]">"emoji"</span>
                  <span className="text-zinc-500 ml-1.5">(Obrigatório - string)</span>
                  <p className="text-[#B7A8AE] text-[11px] mt-0.5">
                    A sequência de emojis que serve como pista visual na tela. <em>(Alias aceito: <code>"emojis"</code>)</em>.
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-[#110F11] border border-[#39272E]/60">
                  <span className="font-mono-num font-bold text-[#E5254D]">"filme"</span>
                  <span className="text-zinc-500 ml-1.5">(Obrigatório - string)</span>
                  <p className="text-[#B7A8AE] text-[11px] mt-0.5">
                    Título oficial da obra que os espectadores devem acertar. <em>(Aliases aceitos: <code>"title"</code>, <code>"movie"</code>, <code>"name"</code>)</em>.
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-[#110F11] border border-[#39272E]/60">
                  <span className="font-mono-num font-bold text-emerald-400">"aliases"</span>
                  <span className="text-zinc-500 ml-1.5">(Opcional - array de strings)</span>
                  <p className="text-[#B7A8AE] text-[11px] mt-0.5">
                    Títulos alternativos ou sinônimos aceitos no chat (ex: <code>["the lion king", "rei leao"]</code>).
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-[#110F11] border border-[#39272E]/60">
                  <span className="font-mono-num font-bold text-amber-400">"category"</span>
                  <span className="text-zinc-500 ml-1.5">(Opcional - string)</span>
                  <p className="text-[#B7A8AE] text-[11px] mt-0.5">
                    Ex: <code>"Disney"</code>, <code>"Pixar"</code>, <code>"Filmes"</code>, <code>"Animes"</code>, <code>"Desenhos"</code>, <code>"Séries"</code>, <code>"Super-heróis"</code>. Padrão: <code>"Filmes"</code>.
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-[#110F11] border border-[#39272E]/60">
                  <span className="font-mono-num font-bold text-cyan-400">"difficulty"</span>
                  <span className="text-zinc-500 ml-1.5">(Opcional - string)</span>
                  <p className="text-[#B7A8AE] text-[11px] mt-0.5">
                    Nível de dificuldade: <code>"facil"</code>, <code>"medio"</code> ou <code>"dificil"</code>. Padrão: <code>"medio"</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Code Block Preview */}
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-300 mb-2">Exemplo Pronto para Uso:</span>
              <pre className="flex-1 p-4 rounded-lg bg-[#110F11] border border-[#39272E] font-mono-num text-[11px] text-zinc-300 overflow-x-auto selection:bg-[#C5163D]">
                {SAMPLE_JSON_STRUCTURE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por filme, emoji ou palavra-chave..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1C171A] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#21171B] border border-[#39272E] text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="px-3.5 py-2.5 rounded-lg bg-[#1C171A] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'Todas as Categorias' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="rounded-lg bg-[#1C171A] border border-[#39272E] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#110F11] border-b border-[#39272E] text-[#B7A8AE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Emojis</th>
                <th className="py-3.5 px-5">Título da Obra (Filme)</th>
                <th className="py-3.5 px-5">Categoria</th>
                <th className="py-3.5 px-5">Dificuldade</th>
                <th className="py-3.5 px-5">Aliases / Sinônimos</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C5163D]" />
                    Carregando biblioteca...
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    Nenhum desafio encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                challenges.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 text-2xl select-none">{c.emoji}</td>
                    <td className="py-3.5 px-5 font-bold text-white font-display text-sm">{c.filme}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-full bg-[#21171B] border border-[#39272E] text-[#B7A8AE] font-semibold text-[11px]">
                        {c.category || 'Filmes'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          c.difficulty === 'facil'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : c.difficulty === 'dificil'
                            ? 'bg-[#C5163D]/20 text-[#E5254D] border border-[#C5163D]/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {c.difficulty || 'medio'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 truncate max-w-xs">
                      {c.aliases && c.aliases.length > 0 ? c.aliases.join(', ') : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 rounded-md bg-[#21171B] hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#39272E]/60"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(c.id, c.filme)}
                        className="p-2 rounded-md bg-[#21171B] hover:bg-[#C5163D]/20 text-zinc-400 hover:text-[#E5254D] transition-colors cursor-pointer border border-[#39272E]/60"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 bg-[#110F11] border-t border-[#39272E] flex items-center justify-between text-xs text-[#B7A8AE]">
          <span>
            Página {page + 1} de {Math.ceil(totalCount / pageSize) || 1}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3.5 py-1.5 rounded-md bg-[#21171B] border border-[#39272E] disabled:opacity-40 cursor-pointer"
            >
              Anterior
            </button>
            <button
              disabled={(page + 1) * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-md bg-[#21171B] border border-[#39272E] disabled:opacity-40 cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create/Edit Single Challenge */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-md rounded-lg bg-[#1C171A] border border-[#39272E] p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#39272E]">
              <h3 className="font-display font-extrabold text-base text-white">
                {editId ? 'Editar Desafio' : 'Novo Desafio de Emojis'}
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#B7A8AE] font-semibold mb-1">
                  Emojis da Obra (Pistas) *
                </label>
                <input
                  type="text"
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  placeholder="ex: 🦁👑🌅"
                  required
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-lg text-white focus:outline-none focus:border-[#C5163D]"
                />
              </div>

              <div>
                <label className="block text-[#B7A8AE] font-semibold mb-1">
                  Título Oficial da Obra (Filme / Anime) *
                </label>
                <input
                  type="text"
                  value={formFilme}
                  onChange={(e) => setFormFilme(e.target.value)}
                  placeholder="ex: O Rei Leão"
                  required
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B7A8AE] font-semibold mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
                  >
                    {categories.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#B7A8AE] font-semibold mb-1">Dificuldade</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#B7A8AE] font-semibold mb-1">
                  Aliases / Sinônimos de Resposta (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={formAliases}
                  onChange={(e) => setFormAliases(e.target.value)}
                  placeholder="ex: rei leao, the lion king"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#110F11] border border-[#39272E] text-xs text-white focus:outline-none focus:border-[#C5163D]"
                />
              </div>

              <div className="pt-4 border-t border-[#39272E] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-md bg-[#21171B] border border-[#39272E] text-[#B7A8AE] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-[#C5163D] hover:bg-[#E5254D] text-white font-bold cursor-pointer shadow-lg shadow-[#C5163D]/20"
                >
                  Salvar Desafio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mass JSON Importer */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-lg bg-[#1C171A] border border-[#39272E] p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#39272E] shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#C5163D]" />
                  Importação em Massa por JSON
                </h3>
                <p className="text-[11px] text-[#B7A8AE]">
                  Cole o array JSON ou selecione um arquivo <code>.json</code>
                </p>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* File upload or paste */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#B7A8AE] font-semibold">
                  Carregar arquivo .json ou colar texto abaixo:
                </span>
                <label className="px-3.5 py-1.5 rounded-md bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-white cursor-pointer font-semibold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#E5254D]" />
                  Selecionar Arquivo .json
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setValidationResult(null);
                }}
                rows={8}
                placeholder={SAMPLE_JSON_STRUCTURE}
                className="w-full p-4 rounded-lg bg-[#110F11] border border-[#39272E] font-mono-num text-xs text-white focus:outline-none focus:border-[#C5163D]"
              />

              {/* Options */}
              <div className="p-3.5 rounded-lg bg-[#110F11] border border-[#39272E] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Tratamento de Duplicados</span>
                  <span className="text-[11px] text-zinc-500">
                    Se o filme já existir na biblioteca do banco
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dups"
                      checked={!overwriteDuplicates}
                      onChange={() => setOverwriteDuplicates(false)}
                      className="text-[#C5163D] focus:ring-[#C5163D]"
                    />
                    <span>Ignorar duplicados</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dups"
                      checked={overwriteDuplicates}
                      onChange={() => setOverwriteDuplicates(true)}
                      className="text-[#C5163D] focus:ring-[#C5163D]"
                    />
                    <span>Atualizar existentes</span>
                  </label>
                </div>
              </div>

              {/* Validation Step Results */}
              {validationResult && (
                <div className="p-4 rounded-lg bg-[#110F11] border border-[#39272E] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#39272E]">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {validationResult.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      Resultado da Validação
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-400 font-semibold">
                        Válidos: <strong>{validationResult.validChallenges.length}</strong>
                      </span>
                      <span className="text-[#E5254D] font-semibold">
                        Erros: <strong>{validationResult.errors.length}</strong>
                      </span>
                      <span className="text-amber-400 font-semibold">
                        Duplicados: <strong>{validationResult.duplicatesCount}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Errors preview if any */}
                  {validationResult.errors.length > 0 && (
                    <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-md bg-[#1C171A] border border-[#C5163D]/30">
                      {validationResult.errors.slice(0, 10).map((err, idx) => (
                        <p key={idx} className="text-[#E5254D] text-[11px]">
                          • {err.message}
                        </p>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <p className="text-[10px] text-zinc-500 italic">
                          ...e mais {validationResult.errors.length - 10} avisos.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preview first valid items */}
                  {validationResult.validChallenges.length > 0 && (
                    <div>
                      <span className="text-[11px] text-[#B7A8AE] font-semibold block mb-1">
                        Prévia dos primeiros registros:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {validationResult.validChallenges.slice(0, 6).map((c, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-md bg-[#1C171A] border border-[#39272E] truncate"
                          >
                            <span className="text-base select-none mr-1.5">{c.emoji}</span>
                            <span className="font-semibold text-white">{c.filme}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-[#39272E] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleValidateJson}
                disabled={isValidating}
                className="px-4 py-2.5 rounded-md bg-[#21171B] hover:bg-white/10 border border-[#39272E] text-white font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Validar e Pré-visualizar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-md bg-[#21171B] border border-[#39272E] text-[#B7A8AE] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!validationResult || validationResult.validChallenges.length === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 rounded-md bg-[#C5163D] hover:bg-[#E5254D] text-white font-bold cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-[#C5163D]/20"
                >
                  {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirmar e Importar ({validationResult?.validChallenges.length || 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
