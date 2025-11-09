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
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="text-start ms-2">
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
 className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-4"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="flex items-center gap-2 mb-4">
 <h3 className="text-lg sm:text-xl font-semibold text-start">
 {t('delegation.chainVisualization')}
 </h3>
 <Badge variant="secondary">{chains.length}</Badge>
 </div>

 {/* Legend */}
 <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
 <div className="flex items-center gap-2">
 <div className="h-3 w-3 rounded-full bg-green-500" />
 <span className="text-xs sm:text-sm text-muted-foreground">
 {t('delegation.status.active')}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="h-3 w-3 rounded-full bg-red-500" />
 <span className="text-xs sm:text-sm text-muted-foreground">
 {t('delegation.circularWarning')}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="h-3 w-3 rounded-full bg-gray-400" />
 <span className="text-xs sm:text-sm text-muted-foreground">
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
 <User className="h-4 w-4 sm:h-5 sm:w-5" />
 <span className="text-start">
 {grantor.full_name}
 <span className="text-sm text-muted-foreground ms-2">
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
 className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg ${
 isCircular ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
 }`}
 >
 {/* Chain Flow */}
 <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
 {/* Grantor */}
 <div className="flex items-center gap-2 flex-shrink-0">
 <div className={`h-3 w-3 rounded-full ${statusColor}`} />
 <span className="text-sm font-medium truncate">
 {grantor.username}
 </span>
 </div>

 {/* Arrow */}
 <ArrowRight
 className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground ${
 isRTL ? 'rotate-180' : ''
 }`}
 />

 {/* Grantee */}
 <div className="flex items-center gap-2 flex-1 min-w-0">
 <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
 <div className="flex flex-col min-w-0">
 <span className="text-sm font-medium truncate">
 {chain.grantee.full_name}
 </span>
 <span className="text-xs text-muted-foreground truncate">
 @{chain.grantee.username}
 </span>
 </div>
 </div>
 </div>

 {/* Permissions */}
 <div className="flex flex-wrap gap-1 sm:gap-2 sm:flex-shrink-0">
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
 <div className="flex items-center gap-2 sm:flex-shrink-0">
 {chain.status === 'active' ? (
 isCircular ? (
 <Badge variant="destructive" className="gap-1">
 <AlertCircle className="h-3 w-3" />
 {t('delegation.circular')}
 </Badge>
 ) : (
 <Badge variant="default" className="gap-1">
 <CheckCircle className="h-3 w-3" />
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
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="text-start ms-2">
 {t('delegation.circularDetected')}
 </AlertDescription>
 </Alert>
 )}
 </div>
 );
}
