FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper and config first to leverage Docker layer caching
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Pre-fetch dependencies
RUN ./mvnw -B dependency:go-offline

# Copy source and build a bootable jar (repackage adds Main-Class)
COPY src src
RUN ./mvnw -B clean package -DskipTests spring-boot:repackage

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/todo-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
