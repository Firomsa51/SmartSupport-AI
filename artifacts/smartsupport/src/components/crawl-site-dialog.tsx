import { useState } from "react";
import { useCrawlSite, useBatchAddDocuments, getListDocumentsQueryKey, getGetChatbotQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe, Loader2, CheckCircle2, AlertCircle, FileText, ChevronRight,
  ArrowLeft, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type Step = "configure" | "crawling" | "select" | "importing" | "done";

interface CrawledPage {
  url: string;
  title: string;
  content: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: number;
}

export default function CrawlSiteDialog({ open, onOpenChange, chatbotId }: Props) {
  const queryClient = useQueryClient();
  const crawlSite = useCrawlSite();
  const batchAdd = useBatchAddDocuments();

  const [step, setStep] = useState<Step>("configure");
  const [seedUrl, setSeedUrl] = useState("");
  const [maxPages, setMaxPages] = useState("20");
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [skipped, setSkipped] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const reset = () => {
    setStep("configure");
    setSeedUrl("");
    setMaxPages("20");
    setPages([]);
    setSelected(new Set());
    setSkipped(0);
    setImportedCount(0);
    crawlSite.reset();
    batchAdd.reset();
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleCrawl = () => {
    const url = seedUrl.trim();
    if (!url) return;
    setStep("crawling");
    crawlSite.mutate(
      { id: chatbotId, data: { url, maxPages: parseInt(maxPages) } },
      {
        onSuccess: (result) => {
          if (result.pages.length === 0) {
            toast.error("No pages could be crawled from this URL.");
            setStep("configure");
            return;
          }
          setPages(result.pages);
          setSkipped(result.skipped);
          setSelected(new Set(result.pages.map((_, i) => i)));
          setStep("select");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Crawl failed";
          toast.error(msg);
          setStep("configure");
        },
      }
    );
  };

  const handleImport = () => {
    const docs = pages
      .filter((_, i) => selected.has(i))
      .map((p) => ({ title: p.title, sourceType: "url" as const, content: p.content, sourceUrl: p.url }));

    if (docs.length === 0) return;
    setStep("importing");

    batchAdd.mutate(
      { id: chatbotId, data: { documents: docs } },
      {
        onSuccess: (result) => {
          setImportedCount(result.created);
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(chatbotId) });
          queryClient.invalidateQueries({ queryKey: getGetChatbotQueryKey(chatbotId) });
          setStep("done");
        },
        onError: () => {
          toast.error("Failed to import documents");
          setStep("select");
        },
      }
    );
  };

  const toggleAll = () => {
    if (selected.size === pages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pages.map((_, i) => i)));
    }
  };

  const toggleOne = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Crawl website</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {step === "configure" && "Discover and import all pages from a website automatically"}
                {step === "crawling" && "Fetching pages from the website…"}
                {step === "select" && `Found ${pages.length} pages — choose which ones to import`}
                {step === "importing" && "Saving and embedding documents…"}
                {step === "done" && `Successfully imported ${importedCount} pages into your knowledge base`}
              </DialogDescription>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            {(["configure", "select", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? "bg-primary text-primary-foreground"
                  : (step === "crawling" && s === "configure") || (step === "importing" && s === "select") || (step === "done" && s !== "done")
                    ? "bg-primary/40 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {step === "configure" || step === "crawling" ? "Configure" : step === "select" || step === "importing" ? "Select pages" : "Done"}
            </span>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Step: Configure */}
          {(step === "configure" || step === "crawling") && (
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website URL</label>
                <Input
                  placeholder="https://docs.yourproduct.com"
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && step === "configure") handleCrawl(); }}
                  disabled={step === "crawling"}
                  data-testid="input-crawl-url"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the starting URL. The crawler will follow links to pages on the same domain.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max pages to crawl</label>
                <Select value={maxPages} onValueChange={setMaxPages} disabled={step === "crawling"}>
                  <SelectTrigger className="w-40" data-testid="select-max-pages">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 30, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} pages</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* What gets skipped info */}
              <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">How it works</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Fetches the seed URL and discovers all same-domain links</li>
                  <li>Skips login pages, checkout flows, and binary files</li>
                  <li>Extracts clean text from each page (removes nav, ads, scripts)</li>
                  <li>You review and choose which pages to import</li>
                </ul>
              </div>

              {step === "crawling" && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">Crawling in progress…</p>
                    <p className="text-xs">Fetching up to {maxPages} pages. This may take 10–30 seconds.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleCrawl}
                  disabled={!seedUrl.trim() || step === "crawling"}
                  className="gap-2"
                  data-testid="button-start-crawl"
                >
                  {step === "crawling" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Crawling…</>
                  ) : (
                    <><Globe className="w-4 h-4" />Start crawl</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => handleClose(false)} disabled={step === "crawling"}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Step: Select pages */}
          {(step === "select" || step === "importing") && (
            <>
              <div className="px-6 py-3 border-b border-border flex items-center justify-between flex-shrink-0 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.size === pages.length}
                    onCheckedChange={toggleAll}
                    data-testid="checkbox-select-all"
                  />
                  <span className="text-sm font-medium">
                    {selected.size} of {pages.length} pages selected
                  </span>
                  {skipped > 0 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {skipped} skipped
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => { setStep("configure"); crawlSite.reset(); }}
                  disabled={step === "importing"}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Re-crawl
                </Button>
              </div>

              <ScrollArea className="flex-1 overflow-auto">
                <div className="px-6 py-3 space-y-1.5">
                  {pages.map((page, i) => (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected.has(i)
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                      data-testid={`row-crawled-${i}`}
                    >
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={() => toggleOne(i)}
                        disabled={step === "importing"}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{page.url}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <FileText className="w-3 h-3 inline mr-1" />
                          {page.content.length.toLocaleString()} chars extracted
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>

              <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {selected.size} page{selected.size !== 1 ? "s" : ""} will be embedded into the knowledge base
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleClose(false)} disabled={step === "importing"}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selected.size === 0 || step === "importing"}
                    className="gap-2"
                    data-testid="button-import-selected"
                  >
                    {step === "importing" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Importing…</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Import {selected.size} page{selected.size !== 1 ? "s" : ""}</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Import complete</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  <span className="text-foreground font-medium">{importedCount} page{importedCount !== 1 ? "s" : ""}</span> have been added to your knowledge base and are being embedded in the background.
                  Your chatbot will use this content in responses within a minute.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={() => { reset(); onOpenChange(false); }} data-testid="button-done">
                  Done
                </Button>
                <Button variant="outline" onClick={reset} data-testid="button-crawl-again">
                  Crawl another site
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
