using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Net.Http;
using System.Threading.Tasks;

namespace mainbackend.Controllers
{
    [ApiController]
    [Route("api/orchestrate")]
    public class OrchestratorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IHubContext<OrchestratorHub> _hubContext;

        // Injectăm și Hub-ul de SignalR pentru a putea trimite mesaje la final
        public sender OrchestratorController(IHttpClientFactory httpClientFactory, IHubContext<OrchestratorHub> hubContext)
        {
            _httpClientFactory = httpClientFactory;
            _hubContext = hubContext;
        }

        [HttpPost("run")]
        public IActionResult ForwardToPython([FromForm] IFormFile file, [FromForm] string prompt, [FromForm] string connectionId)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var memoryStream = new MemoryStream();
            file.CopyTo(memoryStream);
            memoryStream.Position = 0;

            // another background proccess specific bg job 
            _ = Task.Run(async () =>
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    using var content = new MultipartFormDataContent();
                    
                    var streamContent = new StreamContent(memoryStream);
                    streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
                    
                    content.Add(streamContent, "file", file.FileName);
                    content.Add(new StringContent(prompt), "prompt");

                    // this sends a request to python fastapi and await a response later to send back to frontend 
                    var response = await client.PostAsync("http://127.0.0", content);

                    if (response.IsSuccessStatusCode)
                    {
                        var jsonResult = await response.Content.ReadAsStringAsync();
                        
                        // when python finishes the work will send the result in user's browser (signalr)
                        await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveReport", jsonResult);
                    }
                }
                catch (Exception ex)
                {
                    await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveError", ex.Message);
                }
            });

            return Ok(new { message = "File uploaded. AI Training started in background..." });
        }
    }
}
