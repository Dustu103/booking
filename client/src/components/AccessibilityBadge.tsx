import React from "react";

interface AccessibilityInfo {
  closedCaptions?: boolean;
  audioDescription?: boolean;
  wheelchairRows?: string[];
  companionSeatDiscount?: boolean;
}

interface AccessibilityBadgeProps {
  accessibility: AccessibilityInfo | null | undefined;
  /** "compact" = icon-only pills (for cards), "full" = labelled banner (for seat layout) */
  variant?: "compact" | "full";
}

const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({
  accessibility,
  variant = "compact",
}) => {
  if (!accessibility) return null;

  const { closedCaptions, audioDescription, wheelchairRows, companionSeatDiscount } = accessibility;

  const hasAny =
    closedCaptions ||
    audioDescription ||
    (wheelchairRows && wheelchairRows.length > 0) ||
    companionSeatDiscount;

  if (!hasAny) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {closedCaptions && (
          <span
            title="Closed Captions Available"
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400"
          >
            CC
          </span>
        )}
        {audioDescription && (
          <span
            title="Audio Description Available"
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400"
          >
            AD
          </span>
        )}
        {wheelchairRows && wheelchairRows.length > 0 && (
          <span
            title={`Wheelchair accessible rows: ${wheelchairRows.join(", ")}`}
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400"
          >
            ♿
          </span>
        )}
        {companionSeatDiscount && (
          <span
            title="Companion Seat Discount Available"
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400"
          >
            +1
          </span>
        )}
      </div>
    );
  }

  // Full variant — banner shown in SeatLayout
  return (
    <div className="flex flex-wrap gap-3 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
      <p className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">
        ♿ Accessibility Features
      </p>
      {closedCaptions && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <span className="text-blue-400 text-lg">💬</span>
          <div>
            <p className="text-blue-300 text-xs font-black uppercase tracking-wider">Closed Captions</p>
            <p className="text-blue-500 text-[10px] font-bold">Subtitles available on screen</p>
          </div>
        </div>
      )}
      {audioDescription && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <span className="text-purple-400 text-lg">🎧</span>
          <div>
            <p className="text-purple-300 text-xs font-black uppercase tracking-wider">Audio Description</p>
            <p className="text-purple-500 text-[10px] font-bold">Narrated audio track for visually impaired</p>
          </div>
        </div>
      )}
      {wheelchairRows && wheelchairRows.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30">
          <span className="text-green-400 text-lg">♿</span>
          <div>
            <p className="text-green-300 text-xs font-black uppercase tracking-wider">Wheelchair Accessible</p>
            <p className="text-green-500 text-[10px] font-bold">
              Rows: {wheelchairRows.join(", ")} — level-access seating
            </p>
          </div>
        </div>
      )}
      {companionSeatDiscount && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <span className="text-yellow-400 text-lg">🤝</span>
          <div>
            <p className="text-yellow-300 text-xs font-black uppercase tracking-wider">Companion Seat</p>
            <p className="text-yellow-500 text-[10px] font-bold">Free adjacent seat for caregiver/companion</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityBadge;
