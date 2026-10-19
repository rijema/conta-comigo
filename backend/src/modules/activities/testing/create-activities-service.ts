import { ActivitiesService } from '../activities.service';

/**
 * Builds an ActivitiesService for unit tests using named dependencies.
 * Positional constructor calls in specs silently shift whenever a new
 * dependency is injected, so specs should always go through this factory.
 */
export interface ActivitiesServiceTestDeps {
  activityRepo?: any;
  attemptRepo?: any;
  islandRepo?: any;
  islandActivityMappingRepo?: any;
  cycleTrackingRepo?: any;
  kafkaProducer?: any;
  adeService?: any;
  usersService?: any;
  learningEventService?: any;
  dataSource?: any;
  knowledgeTracingService?: any;
  islandCycleValidator?: any;
  cycleManagementService?: any;
  cycleInitializationService?: any;
  recommendationExplanationService?: any;
  ontologyService?: any;
  runtimeSemanticAdapter?: any;
  hybridRecommendationService?: any;
  recommendationOutcomeService?: any;
  reviewOrchestrationService?: any;
}

export function createActivitiesService(deps: ActivitiesServiceTestDeps = {}): ActivitiesService {
  return new ActivitiesService(
    deps.activityRepo ?? {},
    deps.attemptRepo ?? {},
    deps.islandRepo ?? {},
    deps.islandActivityMappingRepo ?? {},
    deps.cycleTrackingRepo ?? {},
    deps.kafkaProducer ?? {},
    deps.adeService ?? {},
    deps.usersService ?? {},
    deps.learningEventService ?? {},
    deps.dataSource ?? {},
    deps.knowledgeTracingService ?? {},
    deps.islandCycleValidator ?? {},
    deps.cycleManagementService ?? {},
    deps.cycleInitializationService ?? {},
    deps.recommendationExplanationService,
    deps.ontologyService,
    deps.runtimeSemanticAdapter,
    deps.hybridRecommendationService,
    deps.recommendationOutcomeService,
    deps.reviewOrchestrationService,
  );
}
