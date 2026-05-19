'use client';

import { useState, useEffect } from 'react';
import { Footer } from '@/components/footer/footer';
import { Navbar } from '@/components/navigation/navbar';
import { ActionBar, VenueGrid, Pagination, VenueDetailModal, ReportModal, ContributionBanner } from '@/components/venue-hub';
import { useVenueModals } from '@/hooks/use-venue-modals';
import { useVenues } from '@/hooks/venues/use-venues';
import type { ReportFormData } from '@/types';

const PER_PAGE = 9;

export default function VenuesPage() {
  const modals = useVenueModals();

  // Partner venues state
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerDebouncedSearch, setPartnerDebouncedSearch] = useState('');
  const [partnerPage, setPartnerPage] = useState(1);

  // Community venues state
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityDebouncedSearch, setCommunityDebouncedSearch] = useState('');
  const [communityPage, setCommunityPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setPartnerDebouncedSearch(partnerSearch), 300);
    return () => clearTimeout(t);
  }, [partnerSearch]);

  useEffect(() => {
    const t = setTimeout(() => setCommunityDebouncedSearch(communitySearch), 300);
    return () => clearTimeout(t);
  }, [communitySearch]);

  useEffect(() => { setPartnerPage(1); }, [partnerDebouncedSearch]);
  useEffect(() => { setCommunityPage(1); }, [communityDebouncedSearch]);

  const {
    venues: partnerVenues,
    pagination: partnerPagination,
    loading: partnerLoading,
  } = useVenues({ hub: 'community', search: partnerDebouncedSearch, page: partnerPage, pageSize: PER_PAGE });

  const {
    venues: communityVenues,
    pagination: communityPagination,
    loading: communityLoading,
  } = useVenues({ hub: 'contribute', search: communityDebouncedSearch, page: communityPage, pageSize: PER_PAGE });

  const handleReportVenue = (data: ReportFormData) => {
    console.log('Report venue:', data);
    modals.showToast('Report submitted successfully!');
    modals.closeReport();
  };

  return (
    <div className="bg-page relative min-h-screen">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 top-0 z-0 h-[620px] overflow-hidden">
        <div className="absolute top-[-220px] left-[-180px] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,oklch(0.9_0.22_128_/_0.4),transparent_65%)] blur-[90px]" />
        <div className="absolute top-[-120px] right-[-140px] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,oklch(0.82_0.17_75_/_0.28),transparent_65%)] blur-[90px]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_75%)] bg-[length:64px_64px] opacity-35" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Page Header */}
        <div className="relative px-4 py-10 md:px-8 md:py-16">
          <div className="mx-auto max-w-[1240px]">
            <div className="text-text-mute mb-3 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
              <span className="bg-lime inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
              COMMUNITY DATABASE · DAVAO
            </div>
            <h1 className="text-text m-0 text-[clamp(42px,5.5vw,72px)] leading-none font-bold tracking-[-0.035em]">Venue Hub</h1>
            <p className="text-text-dim mt-3.5 mb-0 max-w-[62ch] text-[16px] leading-[1.55]">
              Discover, rate, and contribute the best spaces for Web3 and DeFi events in Davao.
            </p>
          </div>
        </div>

        {/* ── Partner Venues ── */}
        <div className="px-4 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-1">
              <div className="text-text-mute inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
                <span className="bg-lime inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_8px_var(--lime-glow)]" />
                PARTNER VENUES
              </div>
              <h2 className="text-text m-0 mt-1 text-[22px] font-semibold tracking-[-0.02em]">Verified Spaces</h2>
              <p className="text-text-mute mt-1 font-mono text-[12px]">
                {partnerLoading ? 'Loading…' : `${partnerPagination?.total_count ?? 0} verified listings`}
              </p>
            </div>
          </div>
        </div>

        <ActionBar
          query={partnerSearch}
          onQueryChange={setPartnerSearch}
          capacityKey="any"
          onCapacityChange={() => {}}
          sortKey="rating"
          onSortChange={() => {}}
        />

        <main className="px-4 pb-8 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <VenueGrid
              venues={partnerVenues}
              loading={partnerLoading}
              perPage={PER_PAGE}
              onViewDetail={modals.openDetail}
            />
            {!partnerLoading && (partnerPagination?.total_pages ?? 0) > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={partnerPage}
                  totalPages={partnerPagination!.total_pages}
                  onPageChange={setPartnerPage}
                />
              </div>
            )}
          </div>
        </main>

        {/* ── Divider ── */}
        <div className="px-4 md:px-8">
          <div className="border-line-soft mx-auto max-w-[1240px] border-t border-dashed py-8" />
        </div>

        {/* ── Community Suggestions ── */}
        <div className="px-4 md:px-8">
          <div className="mx-auto max-w-[1240px] mb-8">
            <ContributionBanner onAddVenue={() => {}} />
          </div>
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-1">
              <div className="text-text-mute inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
                <span className="bg-amber inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_8px_var(--amber-glow)]" />
                COMMUNITY SUGGESTIONS
              </div>
              <div>
                <h2 className="text-text m-0 mt-1 text-[22px] font-semibold tracking-[-0.02em]">Contributed Venues</h2>
                <p className="text-text-mute mt-1 font-mono text-[12px]">
                  {communityLoading ? 'Loading…' : `${communityPagination?.total_count ?? 0} community-submitted venues`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ActionBar
          query={communitySearch}
          onQueryChange={setCommunitySearch}
          capacityKey="any"
          onCapacityChange={() => {}}
          sortKey="rating"
          onSortChange={() => {}}
          onAddVenue={() => {}}
        />

        <main className="px-4 pb-20 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <VenueGrid
              venues={communityVenues}
              loading={communityLoading}
              perPage={PER_PAGE}
              onViewDetail={modals.openDetail}
            />
            {!communityLoading && (communityPagination?.total_pages ?? 0) > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={communityPage}
                  totalPages={communityPagination!.total_pages}
                  onPageChange={setCommunityPage}
                />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Modals */}
      <VenueDetailModal venue={modals.detailVenue} isOpen={Boolean(modals.detailVenue)} onClose={modals.closeDetail} />
      <ReportModal venue={modals.reportVenue} isOpen={Boolean(modals.reportVenue)} onClose={modals.closeReport} onSubmit={handleReportVenue} />

      {modals.toast && (
        <div className="border-line bg-surface fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-3 shadow-lg">
          <div className="bg-lime shadow-lime-glow h-1.5 w-1.5 rounded-full shadow-lg" />
          <span className="text-text text-sm">{modals.toast}</span>
        </div>
      )}
    </div>
  );
}
