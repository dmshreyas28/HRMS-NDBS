FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["HRMS.API.csproj", "./"]
RUN dotnet restore "HRMS.API.csproj"
COPY . .
RUN dotnet build "HRMS.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRMS.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "HRMS.API.dll"]
