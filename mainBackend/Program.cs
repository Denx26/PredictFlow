using mainBackend.Controllers;
var builder = WebApplication.CreateBuilder(args);


// 1. Înregistrare servicii în container
builder.Services.AddControllers();
builder.Services.AddHttpClient(); 
builder.Services.AddSignalR();   

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); 
    });
});

var app = builder.Build();

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthorization();

app.MapControllers();

app.MapHub<OrchestratorHub>("/orchestratorHub");

app.Run();
