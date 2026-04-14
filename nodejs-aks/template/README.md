# ${{ values.name }}

${{ values.description }}

## Deployment Information

- **Namespace**: ${{ values.namespace }}
- **Application Port**: ${{ values.applicationPort }}
- **Service Port**: ${{ values.servicePort }}
- **Replicas**: ${{ values.replicas }}

## Local Development

````bash
npm install
npm start
````
## Deployment

This application is automatically deployed to AKS via GitHub Actions when changes are pushed to the main branch.

### Access the Application

After deployment, the application will be accessible at:

http://LOADBALANCER_IP:${{ values.servicePort }}

Check the GitHub Actions workflow for the exact URL.

## Kubernetes Commands

````bash
# Check pod status
kubectl get pods -n ${{ values.namespace }} -l app=${{ values.name }}

# View logs
kubectl logs -n ${{ values.namespace }} -l app=${{ values.name }} --tail=100 -f

# Get service details
kubectl get service ${{ values.name }}-service -n ${{ values.namespace }}

# Scale deployment
kubectl scale deployment/${{ values.name }} --replicas=3 -n ${{ values.namespace }}
````

## Environment Variables

- `PORT`: Application port (default: ${{ values.applicationPort }})
- `NODE_ENV`: Node environment (production)