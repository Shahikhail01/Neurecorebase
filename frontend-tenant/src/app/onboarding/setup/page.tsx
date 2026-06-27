'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { onboardingService, type OnboardingStep } from '@/services/onboarding.service';
import { tiersService, type Tier } from '@/services/tiers.service';
import {
  departmentTemplatesService,
  type DepartmentTemplate,
} from '@/services/department-templates.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STEPS: { id: OnboardingStep; label: string; description: string }[] = [
  { id: 'company', label: 'Company', description: 'Tell us about your company' },
  { id: 'plan', label: 'Plan', description: 'Pick the right tier for you' },
  { id: 'template', label: 'Template', description: 'Start with a department setup' },
  { id: 'review', label: 'Review', description: 'Customize what was deployed' },
  { id: 'team', label: 'Team', description: 'Invite your teammates' },
  { id: 'complete', label: 'Done', description: 'You are all set!' },
];

interface InviteDraft {
  email: string;
  role: 'USER' | 'ADMIN';
}

export default function OnboardingSetupPage() {
  const user = useTenantAuth();
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>('company');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [templates, setTemplates] = useState<DepartmentTemplate[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);
  const [deploymentSummary, setDeploymentSummary] = useState<{
    departmentsCreated: number;
    agentsCreated: number;
  } | null>(null);
  const [invites, setInvites] = useState<InviteDraft[]>([
    { email: '', role: 'USER' },
  ]);
  const [issuedTokens, setIssuedTokens] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const [state, tierList, tmplList] = await Promise.all([
          onboardingService.getState(),
          tiersService.list(),
          departmentTemplatesService.list(),
        ]);
        setTiers(tierList);
        setTemplates(tmplList);
        setStep(state.step === 'account' ? 'company' : state.step);
        if (state.company?.name) setCompanyName(state.company.name);
        if (state.company?.industry) setIndustry(state.company.industry);
        if (state.tierId) setSelectedTierId(state.tierId);
      } catch (err) {
        console.error(err);
        setError('Failed to load onboarding data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  const goTo = async (next: OnboardingStep) => {
    setError(null);
    if (step === 'company') {
      try {
        await onboardingService.updateState({
          step: next,
          company: { name: companyName, industry },
        } as never);
      } catch {
        // continue optimistically
      }
    }
    setStep(next);
  };

  const handleSelectTier = async (tierId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      setSelectedTierId(tierId);
      await onboardingService.selectTier(tierId);
      await goTo('template');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select tier.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTemplate = async (slug: string) => {
    setSubmitting(true);
    setError(null);
    try {
      setSelectedTemplateSlug(slug);
      const result = await onboardingService.selectTemplate(slug);
      setDeploymentSummary(result);
      await goTo('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishReview = async () => {
    await goTo('team');
  };

  const handleSendInvites = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const valid = invites.filter((i) => i.email.trim().length > 0);
      if (valid.length === 0) {
        await goTo('complete');
        return;
      }
      const res = await onboardingService.inviteMembers(valid);
      setIssuedTokens(res.tokens);
      await goTo('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invites.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await onboardingService.complete();
      router.push('/command-center');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Welcome to NeureCore
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Let us set up your organization in a few quick steps.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={s.id} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {step === 'company' && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Tell us about your company</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We will personalize your dashboard with these details.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry (optional)</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="SaaS, e-commerce, consulting..."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => goTo('plan')} disabled={!companyName.trim()}>
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {step === 'plan' && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Choose your plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You can upgrade anytime. Limits shown are hard caps.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTier(t.id)}
                    disabled={submitting}
                    className={`text-left p-4 rounded-lg border transition ${
                      selectedTierId === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t.name}</span>
                      {t.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                      ${Number(t.monthlyPrice).toFixed(0)}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <li>👥 {t.maxUsers} users</li>
                      <li>🤖 {t.maxAgents} agents</li>
                      <li>📁 {t.maxDepartments} departments</li>
                      <li>💾 {t.maxStorageGB} GB storage</li>
                      <li>🔁 {t.maxApiCalls.toLocaleString()} API calls/day</li>
                    </ul>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === 'template' && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Pick a starting template</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We will deploy these departments and agents for you automatically.
                </p>
              </div>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No templates available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.slug)}
                      disabled={submitting}
                      className={`text-left p-4 rounded-lg border transition ${
                        selectedTemplateSlug === t.slug
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold">{t.name}</div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.description}
                        </p>
                      )}
                      <div className="mt-2 text-xs">
                        <Badge variant="outline">
                          {(t.structure ?? []).length} departments
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {step === 'review' && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Review your setup</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Departments and agents have been created. You can rename or remove
                  them later from the Departments and Agents pages.
                </p>
              </div>
              {deploymentSummary && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      {deploymentSummary.departmentsCreated}
                    </div>
                    <div className="text-xs text-muted-foreground">departments created</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      {deploymentSummary.agentsCreated}
                    </div>
                    <div className="text-xs text-muted-foreground">agents created</div>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('template')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={handleFinishReview}>
                  Looks good <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {step === 'team' && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Invite your team</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional — you can do this later from the Users page.
                </p>
              </div>
              <div className="space-y-3">
                {invites.map((inv, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="teammate@company.com"
                      value={inv.email}
                      onChange={(e) =>
                        setInvites((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, email: e.target.value } : p,
                          ),
                        )
                      }
                      className="flex-1"
                    />
                    <select
                      className="border rounded-md px-2 text-sm bg-background"
                      value={inv.role}
                      onChange={(e) =>
                        setInvites((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, role: e.target.value as never } : p,
                          ),
                        )
                      }
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setInvites((prev) => prev.filter((_, i) => i !== idx))
                      }
                      disabled={invites.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setInvites((prev) => [...prev, { email: '', role: 'USER' }])
                  }
                >
                  + Add another
                </Button>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('review')}>
                  Skip for now
                </Button>
                <Button onClick={handleSendInvites} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Send invites <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {step === 'complete' && (
            <Card className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">You are all set!</h2>
              <p className="text-sm text-muted-foreground">
                Your workspace is ready. {issuedTokens.length > 0 && (
                  <>
                    {issuedTokens.length} invitation{issuedTokens.length === 1 ? '' : 's'} sent.
                  </>
                )}
              </p>
              <Button onClick={handleFinish} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Open command center
              </Button>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}