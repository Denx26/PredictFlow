using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Net.Http;
using System.Threading.Tasks;

using mainBackend;

namespace mainBackend.Controllers
{
    [ApiController]
    [Route("api/orchestrate")]
    public class OrchestratorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IHubContext<OrchestratorHub> _hubContext;

        public OrchestratorController(IHttpClientFactory httpClientFactory, IHubContext<OrchestratorHub> hubContext)
        {
            _httpClientFactory = httpClientFactory;
            _hubContext = hubContext;
        }

        [HttpPost("run")]
        public IActionResult ForwardToPython([FromForm] IFormFile file, [FromForm] string prompt, [FromForm] string connectionId)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var fileBytes = new byte[file.Length];
            using (var stream = file.OpenReadStream())
            {
                int bytesRead = 0;
                int chunk;
                while ((chunk = stream.Read(fileBytes, bytesRead, fileBytes.Length - bytesRead)) > 0)
                {
                    bytesRead += chunk;
                }
            }

            var contentType = file.ContentType;
            var fileName = file.FileName;
            _ = Task.Run(async () =>
            {
                using var memoryStream = new MemoryStream(fileBytes);
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    using var content = new MultipartFormDataContent();

                    var streamContent = new StreamContent(memoryStream);
                    streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

                    content.Add(streamContent, "file", fileName);
                    content.Add(new StringContent(prompt), "prompt");

                    var response = await client.PostAsync("http://127.0.0.1:8000/api/v1/internal-predict", content);

                    if (response.IsSuccessStatusCode)
                    {
                        var jsonResult = await response.Content.ReadAsStringAsync();
                        await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveReport", jsonResult);
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveError", $"Python Engine Error: {errorContent}");
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