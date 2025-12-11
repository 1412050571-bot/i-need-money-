FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper and config first to leverage Docker layer caching
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Pre-fetch dependencies
RUN ./mvnw -B dependency:go-offline

# Copy source and build
COPY src src
RUN ./mvnw -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/todo-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
