import { Module } from '@nestjs/common';
import { MissionFeedController } from './mission-feed.controller';
import { MissionFeedService } from './services/mission-feed.service';
import { MissionFeedAiPrioritizer } from './services/mission-feed-ai.prioritizer';

/**
 * MissionFeedModule — Phase 3 + Phase 5 (Task 5.11).
 *
 * Exposes the Mission Feed endpoints + a background `MissionFeedAiPrioritizer`
 * that re-scores items every 5 minutes. The prioritizer is registered as
 * a provider here (and started in its own `OnModuleInit`) so it shares the
 * module's lifecycle.
 */
@Module({
  controllers: [MissionFeedController],
  providers: [MissionFeedService, MissionFeedAiPrioritizer],
  exports: [MissionFeedService, MissionFeedAiPrioritizer],
})
export class MissionFeedModule {}
