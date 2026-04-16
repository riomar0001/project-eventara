'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { RBAC_COPY } from '@/constants/rbac-management';
import { useRbacFeatures } from '@/hooks/use-rbac-features';
import { FeatureFormDialog } from './feature-form-dialog';
import { FeaturesTable } from './features-table';
import { RbacDeleteDialog } from '../shared/rbac-delete-dialog';
import { createEmptyFeatureForm, type FeatureFormValues } from '../shared/rbac-management-shared';

export function FeaturesManagement() {
  const { createFeature, deleteFeature, error, features, isDeleting, isEmpty, isLoading, isSaving, refresh, updateFeature } = useRbacFeatures();
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [values, setValues] = useState<FeatureFormValues>(createEmptyFeatureForm());
  const [selectedFeature, setSelectedFeature] = useState<FeatureRecordResponse | null>(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [featurePendingDelete, setFeaturePendingDelete] = useState<FeatureRecordResponse | null>(null);

  function resetForm() {
    setIsFormOpen(false);
    setMode('create');
    setValues(createEmptyFeatureForm());
    setSelectedFeature(null);
    setFormError(undefined);
  }

  function openCreateDialog() {
    setMode('create');
    setValues(createEmptyFeatureForm());
    setSelectedFeature(null);
    setFormError(undefined);
    setIsFormOpen(true);
  }

  function openEditDialog(feature: FeatureRecordResponse) {
    setMode('edit');
    setSelectedFeature(feature);
    setValues({
      description: feature.description ?? '',
      is_enabled: feature.is_enabled,
      name: feature.name,
      slug: feature.slug
    });
    setFormError(undefined);
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      description: values.description.trim() || null,
      is_enabled: values.is_enabled,
      name: values.name.trim(),
      slug: values.slug.trim()
    };

    if (!payload.name) {
      setFormError('Feature name is required.');
      return;
    }

    if (!payload.slug) {
      setFormError('Feature slug is required.');
      return;
    }

    const response =
      mode === 'create' ? await createFeature(payload) : selectedFeature ? await updateFeature(selectedFeature.id, payload) : null;

    if (!response) return;

    resetForm();
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!featurePendingDelete) return;

    const deleted = await deleteFeature(featurePendingDelete.id);

    if (!deleted) return;

    setFeaturePendingDelete(null);
  }

  return (
    <>
      <FeaturesTable
        error={error}
        features={features}
        isEmpty={isEmpty}
        isLoading={isLoading}
        onCreate={openCreateDialog}
        onDelete={setFeaturePendingDelete}
        onEdit={openEditDialog}
        onRefresh={refresh}
      />

      <FeatureFormDialog
        error={formError}
        isSaving={isSaving}
        mode={mode}
        onClose={resetForm}
        onSubmit={handleSubmit}
        onValuesChange={(nextValues) => {
          setValues(nextValues);
          setFormError(undefined);
        }}
        open={isFormOpen}
        selectedFeature={selectedFeature}
        values={values}
      />

      <RbacDeleteDialog
        description={
          featurePendingDelete
            ? `${RBAC_COPY.features.deleteDescription} Selected feature: ${featurePendingDelete.name}.`
            : RBAC_COPY.features.deleteDescription
        }
        isDeleting={isDeleting}
        onClose={() => setFeaturePendingDelete(null)}
        onConfirm={handleDelete}
        open={Boolean(featurePendingDelete)}
        title={RBAC_COPY.features.deleteTitle}
      />
    </>
  );
}
