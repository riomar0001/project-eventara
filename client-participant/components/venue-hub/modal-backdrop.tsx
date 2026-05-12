/**
 * Modal Backdrop Component
 */

interface ModalBackdropProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function ModalBackdrop({
  isOpen,
  onClose,
  children,
}: ModalBackdropProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0.1_0.005_150_/_0.7)] p-6 backdrop-blur-lg"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}
