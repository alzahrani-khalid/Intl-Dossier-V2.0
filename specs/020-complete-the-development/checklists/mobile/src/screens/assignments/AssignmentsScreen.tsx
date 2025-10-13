import React, { useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Appbar,
  Searchbar,
  Chip,
  FAB,
  Portal,
  useTheme,
} from 'react-native-paper';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileAssignment } from '../../database/models/MobileAssignment';
import { AssignmentCard } from '../../components/assignments/AssignmentCard';
import { OfflineStatus } from '../../components/OfflineStatus';
import { useSyncService } from '../../hooks/use-sync';
import { useNetworkStatus } from '../../hooks/use-network-status';

interface FilterState {
  status: 'all' | 'pending' | 'in_progress' | 'escalated';
  priority: 'all' | 'urgent' | 'high' | 'medium' | 'low';
  search: string;
}

export const AssignmentsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const database = useDatabase();
  const isRTL = i18n.language === 'ar';
  const { isOnline } = useNetworkStatus();
  const { sync, isSyncing } = useSyncService();

  const [filters, setFilters] = React.useState<FilterState>({
    status: 'all',
    priority: 'all',
    search: '',
  });

  // Query assignments with filters
  const assignments = useDatabase<MobileAssignment>(
    useMemo(() => {
      const conditions = [Q.where('assigned_to_id', database.userId)];

      if (filters.status !== 'all') {
        conditions.push(Q.where('status', filters.status));
      }

      if (filters.priority !== 'all') {
        conditions.push(Q.where('priority', filters.priority));
      }

      if (filters.search) {
        conditions.push(
          Q.or(
            Q.where('title_ar', Q.like(`%${filters.search}%`)),
            Q.where('title_en', Q.like(`%${filters.search}%`))
          )
        );
      }

      return database
        .get<MobileAssignment>('mobile_assignments')
        .query(...conditions, Q.sortBy('sla_deadline', Q.asc));
    }, [database, filters])
  );

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    if (isOnline) {
      await sync(['assignments']);
    }
  }, [isOnline, sync]);

  // Group assignments by SLA status
  const groupedAssignments = useMemo(() => {
    const groups = {
      breached: [] as MobileAssignment[],
      critical: [] as MobileAssignment[],
      warning: [] as MobileAssignment[],
      normal: [] as MobileAssignment[],
    };

    assignments.forEach(assignment => {
      const slaPercent = assignment.slaElapsedPercent;
      if (slaPercent > 100) {
        groups.breached.push(assignment);
      } else if (slaPercent >= 75) {
        groups.critical.push(assignment);
      } else if (slaPercent >= 50) {
        groups.warning.push(assignment);
      } else {
        groups.normal.push(assignment);
      }
    });

    return groups;
  }, [assignments]);

  const renderAssignmentItem = useCallback(
    ({ item }: { item: MobileAssignment }) => (
      <AssignmentCard assignment={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: MobileAssignment) => item.id,
    []
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 120, // Approximate height of AssignmentCard
      offset: 120 * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      <Appbar.Header>
        <Appbar.Content title={t('assignments.title')} />
        <Appbar.Action
          icon="filter-variant"
          onPress={() => {
            // Open filter bottom sheet
          }}
        />
      </Appbar.Header>

      {/* Offline status indicator */}
      {!isOnline && <OfflineStatus />}

      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          { paddingHorizontal: 16, paddingVertical: 8 },
        ]}
      >
        <Searchbar
          placeholder={t('assignments.search_placeholder')}
          value={filters.search}
          onChangeText={text => setFilters(prev => ({ ...prev, search: text }))}
          style={styles.searchBar}
        />
      </View>

      {/* Status filter chips */}
      <View
        style={[
          styles.chipContainer,
          { paddingHorizontal: 16, paddingVertical: 8 },
        ]}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Chip
          selected={filters.status === 'all'}
          onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
          style={styles.chip}
        >
          {t('assignments.filters.all')}
        </Chip>
        <Chip
          selected={filters.status === 'pending'}
          onPress={() => setFilters(prev => ({ ...prev, status: 'pending' }))}
          style={styles.chip}
        >
          {t('assignments.filters.pending')}
        </Chip>
        <Chip
          selected={filters.status === 'in_progress'}
          onPress={() =>
            setFilters(prev => ({ ...prev, status: 'in_progress' }))
          }
          style={styles.chip}
        >
          {t('assignments.filters.in_progress')}
        </Chip>
        <Chip
          selected={filters.status === 'escalated'}
          onPress={() =>
            setFilters(prev => ({ ...prev, status: 'escalated' }))
          }
          style={styles.chip}
        >
          {t('assignments.filters.escalated')}
        </Chip>
      </View>

      {/* Assignments list */}
      <FlatList
        data={assignments}
        renderItem={renderAssignmentItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {t('assignments.empty_state')}
            </Text>
          </View>
        }
        windowSize={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* FAB for quick actions */}
      <Portal>
        <FAB
          icon="plus"
          label={t('assignments.create_new')}
          onPress={() => {
            // Navigate to create assignment
          }}
          style={[
            styles.fab,
            {
              bottom: insets.bottom + 16,
              [isRTL ? 'start' : 'end']: 16,
            },
          ]}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
  },
  searchBar: {
    elevation: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chip: {
    minHeight: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
  },
});
