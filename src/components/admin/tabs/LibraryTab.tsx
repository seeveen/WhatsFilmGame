import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileJson,
  Film,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import { Challenge } from '../../../../shared/types.ts';
import { ImportValidationResult } from '../../../game/import-validator.ts';
import {
  Button,
  Chip,
  Dialog,
  DifficultyMeter,
  EmptyState,
  Field,
  IconButton,
  PageHeader,
  PrefixInput,
  Section,
  Segmented,
  Select,
  Spinner,
  TextInput,
  Textarea,
  useFeedback,
} from '../../ui/index.ts';

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

const CATEGORIES = [
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

const JSON_FIELDS: { key: string; required: boolean; type: string; text: React.ReactNode }[] = [
  {
    key: 'emoji',
    required: true,
    type: 'texto',
    text: (
      <>
        Sequência de emojis que serve de pista na tela. Também aceito: <code className="code">emojis</code>.
      </>
    ),
  },
  {
    key: 'filme',
    required: true,
    type: 'texto',
    text: (
      <>
        Título oficial que os espectadores devem acertar. Também aceitos: <code className="code">title</code>, <code className="code">movie</code>, <code className="code">name</code>.
      </>
    ),
  },
  {
    key: 'aliases',
    required: false,
    type: 'lista de textos',
    text: (
      <>
        Títulos alternativos aceitos no chat, ex.: <code className="code">["the lion king", "rei leao"]</code>.
      </>
    ),
  },
  {
    key: 'category',
    required: false,
    type: 'texto',
    text: (
      <>
        Ex.: <code className="code">Disney</code>, <code className="code">Pixar</code>, <code className="code">Animes</code>. Padrão: <code className="code">Filmes</code>.
      </>
    ),
  },
  {
    key: 'difficulty',
    required: false,
    type: 'texto',
    text: (
      <>
        <code className="code">facil</code>, <code className="code">medio</code> ou <code className="code">dificil</code>. Padrão: <code className="code">medio</code>.
      </>
    ),
  },
];

const PAGE_SIZE = 15;

export const LibraryTab: React.FC = () => {
  const { toast, confirm } = useFeedback();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(0);
  const pageSize = PAGE_SIZE;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  // Diálogos
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  // Formulário de desafio único
  const [editId, setEditId] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState('');
  const [formFilme, setFormFilme] = useState('');
  const [formCategory, setFormCategory] = useState('Filmes');
  const [formDifficulty, setFormDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [formAliases, setFormAliases] = useState('');
  const [formTouched, setFormTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Importação em massa
  const [jsonInput, setJsonInput] = useState('');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Descarta respostas antigas quando o usuário muda filtro/página rápido.
  const requestSeq = useRef(0);

  const fetchChallenges = async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        search: searchTerm,
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      const res = await fetch(`/api/challenges?${params.toString()}`);
      const data = await res.json();
      if (seq !== requestSeq.current) return;
      setChallenges(data.challenges || []);
      setTotalCount(data.total || 0);
    } catch (e: any) {
      console.error('Failed to load challenges:', e);
      if (seq === requestSeq.current) setLoadError(true);
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [categoryFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (page === 0) fetchChallenges();
    else setPage(0);
  };

  const resetForm = () => {
    setEditId(null);
    setFormEmoji('');
    setFormFilme('');
    setFormCategory('Filmes');
    setFormDifficulty('medio');
    setFormAliases('');
    setFormTouched(false);
  };

  const openNewModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (c: Challenge) => {
    setEditId(c.id);
    setFormEmoji(c.emoji);
    setFormFilme(c.filme);
    setFormCategory(c.category || 'Filmes');
    setFormDifficulty(c.difficulty || 'medio');
    setFormAliases((c.aliases || []).join(', '));
    setFormTouched(false);
    setIsCreateOpen(true);
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmoji.trim() || !formFilme.trim()) {
      setFormTouched(true);
      return;
    }

    const aliases = formAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);
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
        const wasEdit = !!editId;
        setIsCreateOpen(false);
        resetForm();
        toast('success', wasEdit ? 'Desafio atualizado.' : 'Novo desafio cadastrado.');
        fetchChallenges();
      } else {
        const data = await res.json().catch(() => ({}));
        toast('error', data.error || 'O servidor recusou o desafio.', 'Não foi possível salvar');
      }
    } catch (e: any) {
      toast('error', e.message, 'Erro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChallenge = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Excluir “${title}”?`,
      message: 'O desafio sai da biblioteca e não será mais sorteado. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir desafio',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('success', 'Desafio excluído.');
        // Excluiu o último item da última página: volta uma página (o efeito recarrega).
        if (challenges.length === 1 && page > 0) setPage(page - 1);
        else fetchChallenges();
      } else {
        toast('error', 'O servidor não excluiu o desafio.');
      }
    } catch (e: any) {
      toast('error', e.message, 'Erro');
    }
  };

  // ── Importação em massa ──
  const openImport = () => {
    setValidationResult(null);
    setIsImportOpen(true);
  };

  const handleValidateJson = async () => {
    if (!jsonInput.trim()) {
      toast('warn', 'Cole o JSON ou selecione um arquivo.');
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
      toast('error', e.message, 'Falha ao validar o JSON');
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
    e.target.value = '';
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
        toast('success', `Inseridos: ${data.inserted} · Atualizados: ${data.updated} · Ignorados: ${data.ignored}`, 'Importação concluída');
        setIsImportOpen(false);
        setJsonInput('');
        setValidationResult(null);
        fetchChallenges();
      } else {
        toast('error', data.error || 'Erro na importação.');
      }
    } catch (e: any) {
      toast('error', e.message, 'Erro na requisição');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportJson = () => {
    window.location.href = '/api/challenges/export';
    toast('info', 'O download do arquivo JSON da biblioteca foi iniciado.');
  };

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_JSON_STRUCTURE);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2500);
    } catch {
      toast('warn', 'Não foi possível copiar automaticamente. Selecione o texto do exemplo e copie manualmente.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstShown = totalCount === 0 ? 0 : page * pageSize + 1;
  const lastShown = Math.min(totalCount, page * pageSize + challenges.length);
  const filtering = categoryFilter !== 'all' || searchTerm.trim() !== '';
  const categoryOptions = CATEGORIES.includes(formCategory) ? CATEGORIES : [...CATEGORIES, formCategory];

  const emojiMissing = formTouched && !formEmoji.trim();
  const filmeMissing = formTouched && !formFilme.trim();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Conteúdo"
        title="Biblioteca"
        description={`${totalCount} ${totalCount === 1 ? 'desafio disponível' : 'desafios disponíveis'}${filtering ? ' com os filtros atuais' : ' para sorteio no jogo'}.`}
        actions={
          <>
            <Button icon={<Download />} onClick={handleExportJson} title="Baixa toda a biblioteca em um arquivo JSON">
              Exportar JSON
            </Button>
            <Button icon={<Upload />} onClick={openImport}>
              Importar JSON
            </Button>
            <Button variant="primary" icon={<Plus />} onClick={openNewModal}>
              Novo desafio
            </Button>
          </>
        }
      />

      <Section>
        <div className="lib-list">
          <div className="toolbar">
            <form className="toolbar__grow lib-search" onSubmit={handleSearchSubmit} role="search">
              <PrefixInput
                prefix={<Search />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por filme, emoji ou palavra-chave…"
                aria-label="Buscar desafios"
              />
              <Button type="submit">Buscar</Button>
            </form>
            <Select
              aria-label="Filtrar por categoria"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              className="lib-filter"
            >
              <option value="all">Todas as categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              icon={<FileJson />}
              aria-expanded={showDocs}
              aria-controls="lib-guide"
              onClick={() => setShowDocs((v) => !v)}
            >
              {showDocs ? 'Ocultar guia do JSON' : 'Guia do JSON'}
            </Button>
          </div>

          {showDocs && (
            <div className="lib-guide" id="lib-guide">
              <div className="lib-guide__fields">
                <h3 className="lib-guide__title">Campos de cada objeto</h3>
                <dl>
                  {JSON_FIELDS.map((f) => (
                    <div key={f.key} className="lib-guide__field">
                      <dt>
                        <code className="lib-guide__key">{f.key}</code>
                        <span className="lib-guide__meta">
                          {f.required ? 'obrigatório' : 'opcional'} · {f.type}
                        </span>
                      </dt>
                      <dd>{f.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="lib-guide__sample">
                <div className="lib-guide__samplehead">
                  <h3 className="lib-guide__title">Exemplo pronto para usar</h3>
                  <Button
                    size="sm"
                    icon={copiedSample ? <CircleCheck /> : <Copy />}
                    onClick={handleCopySample}
                  >
                    {copiedSample ? 'Copiado' : 'Copiar modelo'}
                  </Button>
                </div>
                <pre className="codeblock" tabIndex={0}>
                  {SAMPLE_JSON_STRUCTURE}
                </pre>
              </div>
            </div>
          )}

          <div className="table-wrap" aria-busy={isLoading}>
            <table className="table lib-table">
              <thead>
                <tr>
                  <th scope="col">Emojis</th>
                  <th scope="col">Título</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Dificuldade</th>
                  <th scope="col" className="lib-col-aliases">
                    Aliases
                  </th>
                  <th scope="col" className="is-end">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && challenges.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="lib-state">
                        <Spinner />
                        Carregando biblioteca…
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<CircleAlert />}
                        title="Não foi possível carregar a biblioteca"
                        description="Confira se o servidor do jogo está rodando e tente de novo."
                        action={<Button onClick={fetchChallenges}>Tentar novamente</Button>}
                      />
                    </td>
                  </tr>
                ) : challenges.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<Film />}
                        title={filtering ? 'Nenhum desafio encontrado' : 'A biblioteca está vazia'}
                        description={
                          filtering
                            ? 'Nenhum desafio corresponde à busca ou à categoria selecionada.'
                            : 'Cadastre um desafio ou importe uma lista em JSON para começar.'
                        }
                        action={
                          !filtering ? (
                            <Button variant="primary" icon={<Plus />} onClick={openNewModal}>
                              Novo desafio
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  challenges.map((c) => (
                    <tr key={c.id} className={isLoading ? 'is-stale' : undefined}>
                      <td className="lib-table__emoji emoji">{c.emoji}</td>
                      <td className="lib-table__title">{c.filme}</td>
                      <td>
                        <Chip>{c.category || 'Filmes'}</Chip>
                      </td>
                      <td>
                        <DifficultyMeter level={c.difficulty || 'medio'} />
                      </td>
                      <td className="lib-table__aliases lib-col-aliases" title={c.aliases && c.aliases.length > 0 ? c.aliases.join(', ') : undefined}>
                        {c.aliases && c.aliases.length > 0 ? c.aliases.join(', ') : '—'}
                      </td>
                      <td className="is-end">
                        <div className="lib-table__actions">
                          <IconButton label={`Editar ${c.filme}`} size="sm" onClick={() => openEditModal(c)}>
                            <Pencil />
                          </IconButton>
                          <IconButton label={`Excluir ${c.filme}`} size="sm" onClick={() => handleDeleteChallenge(c.id, c.filme)}>
                            <Trash2 />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-foot">
              <span className="num">
                {totalCount === 0 ? 'Nenhum resultado' : `${firstShown}–${lastShown} de ${totalCount}`}
                <span className="lib-foot__page"> · Página {page + 1} de {totalPages}</span>
              </span>
              <div className="lib-pager">
                <Button size="sm" icon={<ChevronLeft />} disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Anterior
                </Button>
                <Button size="sm" disabled={(page + 1) * pageSize >= totalCount} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Criar / editar */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editId ? 'Editar desafio' : 'Novo desafio'}
        description="A sequência de emojis é a pista; o título é a resposta que o chat precisa acertar."
        footer={
          <>
            <Button onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" form="challenge-form" loading={isSaving}>
              Salvar desafio
            </Button>
          </>
        }
      >
        <form id="challenge-form" className="lib-form" onSubmit={handleSaveChallenge} noValidate>
          <Field label="Emojis (pistas)" required htmlFor="ch-emoji" error={emojiMissing ? 'Informe os emojis da pista.' : undefined}>
            <TextInput id="ch-emoji" emoji value={formEmoji} onChange={(e) => setFormEmoji(e.target.value)} placeholder="🦁👑🌅" autoComplete="off" />
          </Field>
          <Field label="Título da obra" required htmlFor="ch-filme" error={filmeMissing ? 'Informe o título.' : undefined}>
            <TextInput id="ch-filme" value={formFilme} onChange={(e) => setFormFilme(e.target.value)} placeholder="O Rei Leão" autoComplete="off" />
          </Field>
          <div className="form-grid form-grid--2">
            <Field label="Categoria" htmlFor="ch-category">
              <Select id="ch-category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dificuldade" htmlFor="ch-difficulty">
              <Select id="ch-difficulty" value={formDifficulty} onChange={(e) => setFormDifficulty(e.target.value as any)}>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </Select>
            </Field>
          </div>
          <Field
            label="Aliases (respostas alternativas)"
            htmlFor="ch-aliases"
            hint="Separe por vírgula. Ex.: rei leao, the lion king"
          >
            <TextInput id="ch-aliases" value={formAliases} onChange={(e) => setFormAliases(e.target.value)} placeholder="rei leao, the lion king" autoComplete="off" />
          </Field>
        </form>
      </Dialog>

      {/* Importação em massa */}
      <Dialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        size="lg"
        title="Importar desafios por JSON"
        description="Cole uma lista em JSON ou escolha um arquivo .json. Nada é gravado antes de você confirmar."
        splitFooter
        footer={
          <>
            <Button onClick={handleValidateJson} loading={isValidating}>
              Validar e pré-visualizar
            </Button>
            <div className="lib-import__confirm">
              <Button onClick={() => setIsImportOpen(false)}>Cancelar</Button>
              <Button
                variant="primary"
                disabled={!validationResult || validationResult.validChallenges.length === 0}
                loading={isImporting}
                onClick={handleConfirmImport}
              >
                Importar{validationResult ? ` (${validationResult.validChallenges.length})` : ''}
              </Button>
            </div>
          </>
        }
      >
        <div className="lib-import">
          <div className="lib-import__file">
            <label className="btn btn--secondary btn--sm">
              <Upload />
              Escolher arquivo .json
              <input type="file" accept=".json" onChange={handleFileUpload} className="sr-only" />
            </label>
            <span className="field__hint">ou cole o texto abaixo</span>
          </div>

          <Textarea
            mono
            rows={9}
            value={jsonInput}
            aria-label="Conteúdo JSON a importar"
            onChange={(e) => {
              setJsonInput(e.target.value);
              setValidationResult(null);
            }}
            placeholder={SAMPLE_JSON_STRUCTURE}
            spellCheck={false}
          />

          <div className="lib-import__dups">
            <div>
              <div className="setting-row__label">Filmes que já existem</div>
              <div className="setting-row__hint">O que fazer quando o título já estiver na biblioteca.</div>
            </div>
            <Segmented
              label="Tratamento de duplicados"
              value={overwriteDuplicates ? 'update' : 'ignore'}
              onChange={(v) => setOverwriteDuplicates(v === 'update')}
              options={[
                { value: 'ignore', label: 'Ignorar duplicados' },
                { value: 'update', label: 'Atualizar existentes' },
              ]}
            />
          </div>

          {validationResult && (
            <div className="lib-result" role="status">
              <div className="lib-result__head">
                <span className="lib-result__title">
                  {validationResult.isValid ? <CircleCheck className="lib-result__ok" /> : <TriangleAlert className="lib-result__warn" />}
                  Resultado da validação
                </span>
                <span className="lib-result__counts">
                  <Chip tone="success">{validationResult.validChallenges.length} válidos</Chip>
                  <Chip tone={validationResult.errors.length > 0 ? 'brand' : 'neutral'}>{validationResult.errors.length} erros</Chip>
                  <Chip tone={validationResult.duplicatesCount > 0 ? 'warn' : 'neutral'}>{validationResult.duplicatesCount} duplicados</Chip>
                </span>
              </div>

              {validationResult.errors.length > 0 && (
                <ul className="lib-result__errors">
                  {validationResult.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>{err.message}</li>
                  ))}
                  {validationResult.errors.length > 10 && <li className="lib-result__more">…e mais {validationResult.errors.length - 10} avisos.</li>}
                </ul>
              )}

              {validationResult.validChallenges.length > 0 && (
                <div>
                  <div className="field__label lib-result__label">Prévia dos primeiros registros</div>
                  <ul className="lib-result__preview">
                    {validationResult.validChallenges.slice(0, 6).map((c, i) => (
                      <li key={i}>
                        <span className="emoji">{c.emoji}</span>
                        <span>{c.filme}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
