cmake_minimum_required(VERSION 3.20)
project(sonik_native VERSION 1.0.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Optimization Flags
if(MSVC)
    add_compile_options(/O2 /fp:fast /W4)
else()
    add_compile_options(-O3 -ffast-math -Wall -Wextra -pthread)
endif()

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Source files
set(SONIK_SOURCES
    src/SonikAudioEngine.cpp
    src/Vst3PluginHost.cpp
    src/NodeAddon.cpp
)

# Shared Library Target
add_library(sonik_native SHARED ${SONIK_SOURCES})

# Target Properties
set_target_properties(sonik_native PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# Platform-specific linkages
if(WIN32)
    target_link_libraries(sonik_native PRIVATE winmm dsound ole32 uuid)
elseif(APPLE)
    find_library(COREAUDIO_LIB CoreAudio REQUIRED)
    find_library(AUDIOTOOLBOX_LIB AudioToolbox REQUIRED)
    find_library(AUDIOUNIT_LIB AudioUnit REQUIRED)
    target_link_libraries(sonik_native PRIVATE ${COREAUDIO_LIB} ${AUDIOTOOLBOX_LIB} ${AUDIOUNIT_LIB})
else()
    target_link_libraries(sonik_native PRIVATE asound pthread)
endif()
