import { Card, CardContent } from "@/components/ui/card";
import { SURF_ACHIEVEMENTS } from "@/types/achievement";
import { cn } from "@/lib/utils";

export default function ConquistasPage() {
  const unlockedIds: string[] = [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Conquistas</h1>
        <p className="text-sm text-slate-500">Suas medalhas e conquistas</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SURF_ACHIEVEMENTS.map((achievement) => {
          const unlocked = unlockedIds.includes(achievement.id);
          return (
            <Card
              key={achievement.id}
              className={cn(
                "text-center transition-all",
                unlocked ? "border-sky-200 bg-sky-50" : "opacity-50 grayscale"
              )}
            >
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-semibold text-slate-900">{achievement.name}</p>
                <p className="text-xs text-slate-500 mt-1">{achievement.description}</p>
                <p className="text-xs font-medium text-sky-600 mt-2">+{achievement.xpReward} XP</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
