using Microsoft.AspNetCore.SignalR;

namespace mainBackend.Controllers
{
    public class OrchestratorHub : Hub
    {
        public string GetConnectionId()
        {
            return Context.ConnectionId;
        }
    }
}
