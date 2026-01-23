import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertCircle, CheckCircle, User } from 'lucide-react';

interface DelegationNode {
 id: string;
 username: string;
 full_name: string;
 role: string;
}

interface DelegationChain {
 grantor: DelegationNode;
 grantee: DelegationNode;
 permissions: string[];
 status: 'active' | 'expired' | 'revoked';
 isCircular?: boolean;
}

interface DelegationChainVisualizationProps {
 chains: DelegationChain[];
 highlightCircular?: boolean;
}

export function DelegationChainVisualization({
 chains,
 highlightCircular = true,
}: DelegationChainVisualizationProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 if (chains.length === 0) {
 return (
 <Alert>
 <AlertCircle className="size-4" />
 <AlertDescription className="ms-2 text-start">
 {t('delegation.noChains')}
 </AlertDescription>
 </Alert>
 );
 }

 // Group chains by grantor
 const chainsByGrantor = chains.reduce((acc, chain) => {
 const key = chain.grantor.id;
 if (!acc[key]) {
 acc[key] = [];
 }
 acc[key].push(chain);
 return acc;
 }, {} as Record<string, DelegationChain[]>);

 return (
 <div
 className="container mx-auto space-y-4 px-4 sm:px-6 lg:px-8"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="mb-4 flex items-center gap-2">
 <h3 className="text-start text-lg font-semibold sm:text-xl">
 {t('delegation.chainVisualization')}
 </h3>
 <Badge variant="secondary">{chains.length}</Badge>
 </div>

 {/* Legend */}
 <div className="mb-4 flex flex-wrap gap-2 sm:gap-4">
 <div className="flex items-center gap-2">
 <div className="size-3 rounded-full bg-green-500" />
 <span className="text-xs text-muted-foreground sm:text-sm">
 {t('delegation.status.active')}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="size-3 rounded-full bg-red-500" />
 <span className="text-xs text-muted-foreground sm:text-sm">
 {t('delegation.circularWarning')}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="size-3 rounded-full bg-gray-400" />
 <span className="text-xs text-muted-foreground sm:text-sm">
 {t('delegation.status.expired')}
 </span>
 </div>
 </div>

 {/* Chains */}
 <div className="space-y-4">
 {Object.entries(chainsByGrantor).map(([grantorId, grantorChains]) => {
 const grantor = grantorChains[0].grantor;

 return (
 <Card key={grantorId} className="overflow-hidden">
 <CardHeader className="bg-muted/50">
 <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
 <User className="size-4 sm:size-5" />
 <span className="text-start">
 {grantor.full_name}
 <span className="ms-2 text-sm text-muted-foreground">
 (@{grantor.username})
 </span>
 </span>
 </CardTitle>
 <CardDescription className="text-start">
 <Badge variant="outline" className="mt-1">
 {grantor.role}
 </Badge>
 </CardDescription>
 </CardHeader>

 <CardContent className="pt-4 sm:pt-6">
 <div className="space-y-3 sm:space-y-4">
 {grantorChains.map((chain, index) => {
 const isCircular = chain.isCircular && highlightCircular;
 const statusColor =
 chain.status === 'active'
 ? isCircular
 ? 'bg-red-500'
 : 'bg-green-500'
 : 'bg-gray-400';

 return (
 <div
 key={index}
 className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${
 isCircular ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
 }`}
 >
 {/* Chain Flow */}
 <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
 {/* Grantor */}
 <div className="flex shrink-0 items-center gap-2">
 <div className={`size-3 rounded-full ${statusColor}`} />
 <span className="truncate text-sm font-medium">
 {grantor.username}
 </span>
 </div>

 {/* Arrow */}
 <ArrowRight
 className={`size-4 shrink-0 text-muted-foreground sm:size-5 ${
 isRTL ? 'rotate-180' : ''
 }`}
 />

 {/* Grantee */}
 <div className="flex min-w-0 flex-1 items-center gap-2">
 <User className="size-4 shrink-0 text-muted-foreground" />
 <div className="flex min-w-0 flex-col">
 <span className="truncate text-sm font-medium">
 {chain.grantee.full_name}
 </span>
 <span className="truncate text-xs text-muted-foreground">
 @{chain.grantee.username}
 </span>
 </div>
 </div>
 </div>

 {/* Permissions */}
 <div className="flex flex-wrap gap-1 sm:shrink-0 sm:gap-2">
 {chain.permissions.slice(0, 2).map((perm) => (
 <Badge key={perm} variant="secondary" className="text-xs">
 {perm}
 </Badge>
 ))}
 {chain.permissions.length > 2 && (
 <Badge variant="secondary" className="text-xs">
 +{chain.permissions.length - 2}
 </Badge>
 )}
 </div>

 {/* Status */}
 <div className="flex items-center gap-2 sm:shrink-0">
 {chain.status === 'active' ? (
 isCircular ? (
 <Badge variant="destructive" className="gap-1">
 <AlertCircle className="size-3" />
 {t('delegation.circular')}
 </Badge>
 ) : (
 <Badge variant="default" className="gap-1">
 <CheckCircle className="size-3" />
 {t('delegation.status.active')}
 </Badge>
 )
 ) : (
 <Badge variant="secondary" className="gap-1">
 {t(`delegation.status.${chain.status}`)}
 </Badge>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>

 {/* Circular Delegation Warning */}
 {highlightCircular && chains.some((c) => c.isCircular) && (
 <Alert variant="destructive" className="mt-4">
 <AlertCircle className="size-4" />
 <AlertDescription className="ms-2 text-start">
 {t('delegation.circularDetected')}
 </AlertDescription>
 </Alert>
 )}
 </div>
 );
}
