/**
 * Venue Hub Page - Main entry point
 */

"use client"

import { AuthenticatedNav } from "@/components/navigation"
import {
  PageHeader,
  ActionBar,
  ResultsBar,
  VenueGrid,
  Pagination,
  AddVenueModal,
  VenueDetailModal,
  ReportModal,
} from "@/components/venue-hub"
import { useVenueFilters } from "@/hooks/use-venue-filters"
import { useVenueModals } from "@/hooks/use-venue-modals"
import { MOCK_VENUES } from "@/constants/venues"
import type { AddVenueFormData, ReportFormData } from "@/types"

export default function VenuesPage() {
  const filters = useVenueFilters(MOCK_VENUES)
  const modals = useVenueModals()

  const handleAddVenue = (data: AddVenueFormData) => {
    console.log("Add venue:", data)
    modals.showToast("Venue added successfully!")
    modals.closeAddVenue()
  }

  const handleReportVenue = (data: ReportFormData) => {
    console.log("Report venue:", data)
    modals.showToast("Report submitted successfully!")
    modals.closeReport()
  }

  const activeFilters = []
  if (filters.query) {
    activeFilters.push({
      label: `Search: ${filters.query}`,
      onRemove: () => filters.setQuery(""),
    })
  }
  if (filters.capacityKey !== "any") {
    activeFilters.push({
      label: `Capacity: ${filters.capacityKey}`,
      onRemove: () => filters.setCapacityKey("any"),
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Navigation */}
      <AuthenticatedNav
        userName="Camille"
        userTier="Participant"
        activeLink="Venue Hub"
      />

      {/* Page Header */}
      <PageHeader totalVenues={MOCK_VENUES.length} />

      {/* Action Bar */}
      <ActionBar
        query={filters.query}
        onQueryChange={filters.setQuery}
        capacityKey={filters.capacityKey}
        onCapacityChange={filters.setCapacityKey}
        sortKey={filters.sortKey}
        onSortChange={filters.setSortKey}
        onAddVenue={modals.openAddVenue}
      />

      {/* Main Content */}
      <main className="px-8 py-8">
        <div className="mx-auto max-w-[1240px]">
          {/* Results Bar */}
          {(activeFilters.length > 0 || filters.filteredVenues.length > 0) && (
            <ResultsBar
              count={filters.filteredVenues.length}
              activeFilters={activeFilters}
            />
          )}

          {/* Venue Grid */}
          <div className="py-8">
            <VenueGrid
              venues={filters.paginatedVenues}
              onViewDetail={modals.openDetail}
              onEditVenue={modals.openEditVenue}
              onShareVenue={(v) => {
                modals.showToast(`Shared: ${v.name}`)
              }}
              onReportVenue={modals.openReport}
              onAddVenue={modals.openAddVenue}
            />
          </div>

          {/* Pagination */}
          {filters.totalPages > 1 && (
            <Pagination
              currentPage={filters.page}
              totalPages={filters.totalPages}
              onPageChange={filters.setPage}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <AddVenueModal
        isOpen={modals.addVenueOpen}
        onClose={modals.closeAddVenue}
        onSubmit={handleAddVenue}
      />

      <AddVenueModal
        isOpen={Boolean(modals.editVenue)}
        onClose={modals.closeEditVenue}
        onSubmit={handleAddVenue}
        initialVenue={modals.editVenue || undefined}
        isEditing={true}
      />

      <VenueDetailModal
        venue={modals.detailVenue}
        isOpen={Boolean(modals.detailVenue)}
        onClose={modals.closeDetail}
      />

      <ReportModal
        venue={modals.reportVenue}
        isOpen={Boolean(modals.reportVenue)}
        onClose={modals.closeReport}
        onSubmit={handleReportVenue}
      />

      {/* Toast Notification */}
      {modals.toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-lg">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--lime)] shadow-lg shadow-[var(--lime-glow)]" />
          <span className="text-sm text-[var(--text)]">{modals.toast}</span>
        </div>
      )}
    </div>
  )
}
