CXX := g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra

.PHONY: all build test clean

all: build

build:
	mkdir -p bin
	$(CXX) $(CXXFLAGS) src/engine.cpp -o bin/table_tale_engine

test: build
	$(CXX) $(CXXFLAGS) tests/test_engine.cpp -o bin/test_engine
	./bin/test_engine

clean:
	rm -rf bin
