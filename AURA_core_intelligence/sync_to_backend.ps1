# Copy JSONs to backend folder
Copy-Item -Path "zones.json" -Destination "../../aura-admin/backend/data/" -Force
Copy-Item -Path "alerts.json" -Destination "../../aura-admin/backend/data/" -Force
Copy-Item -Path "analytics.json" -Destination "../../aura-admin/backend/data/" -Force
Copy-Item -Path "playback.json" -Destination "../../aura-admin/backend/data/" -Force
Copy-Item -Path "safeRoute.json" -Destination "../../aura-admin/backend/data/" -Force

Write-Host "✅ JSONs synced to backend!"
