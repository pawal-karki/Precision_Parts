# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# Base stage for runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
ENV ASPNETCORE_URLS="http://+:${PORT:-8080}"
EXPOSE 8080

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files for caching packages
COPY ["CleanApp.API/CleanApp.API.csproj", "CleanApp.API/"]
COPY ["CleanApp.Application/CleanApp.Application.csproj", "CleanApp.Application/"]
COPY ["CleanApp.Domain/CleanApp.Domain.csproj", "CleanApp.Domain/"]
COPY ["CleanApp.Infrastructure/CleanApp.Infrastructure.csproj", "CleanApp.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "./CleanApp.API/CleanApp.API.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/CleanApp.API"
RUN dotnet build "./CleanApp.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./CleanApp.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CleanApp.API.dll"]
