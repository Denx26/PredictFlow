using Microsoft.AspNetCore.SignalR;


namespace mainBackend.Controllers
{

    // this acts as an contact point to send messages to browser 
    public class OrchestratorHub : Hub
    {
        // i let this blank cuz we use it only for sending messages to clients 
        // i add also this method that calls frontend for displaying the connection id
        public string GetConnection()
        {
            return Context.ConnectionId;
        }
        
    }
}