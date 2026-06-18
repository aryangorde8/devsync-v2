from django.core.management.base import BaseCommand

from portfolio.models import ActivityLog, Project


class Command(BaseCommand):
    help = "Backfill activity logs for existing projects that have none"

    def handle(self, *args, **options):
        projects = Project.objects.all()
        created = 0
        for project in projects:
            already_logged = ActivityLog.objects.filter(
                object_id=project.pk,
                model_name="Project",
            ).exists()
            if not already_logged:
                ActivityLog.objects.create(
                    user=project.user,
                    action="create",
                    model_name="Project",
                    object_id=project.pk,
                    object_repr=str(project)[:200],
                    changes={},
                )
                created += 1
                self.stdout.write(f"  Logged: {project.title}")

        self.stdout.write(self.style.SUCCESS(f"Backfilled {created} activity log(s)."))
