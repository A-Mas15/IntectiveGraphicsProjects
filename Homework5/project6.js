var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// Distance (dist) and direction (L) towards the light
		vec3 L = lights[i].position - position;	
		float dist = length(L);	
		L = normalize(L);

		// Shadow check
		Ray shadowRay;
		shadowRay.pos = position + 0.001*normal; // a little off-set to avoid self-collision
		shadowRay.dir = L;
		HitInfo shadowHit;
		if(IntersectRay(shadowHit, shadowRay) && shadowHit.t < dist){
			continue; // There is a shadow
		}
		// diffuse = k_d * I_l * max(O, dot(normal, L))
		vec3 diffuse = mtl.k_d * lights[i].intensity * max(0.0, dot(normal, L));
		// Blinn-Phong specular component
		vec3 H = normalize(L + view);
		// specular = k_s*I_l * max(0, dot(nomal, H))^n
		vec3 specular = mtl.k_s * lights[i].intensity* pow((max(0.0, dot(normal, H))), mtl.n);
		color += diffuse + specular;	// change this line
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	float a = dot(ray.dir, ray.dir);

	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// at^2 + bt + c = 0
		// t = (-b pm sqrt{delta})/2a 			delta = b^2 - 4ac
		float b = 2.0* dot(ray.dir, (ray.pos - spheres[i].center));
		float c = dot((ray.pos - spheres[i].center), (ray.pos - spheres[i].center)) - spheres[i].radius*spheres[i].radius;
		float delta = b*b - (4.0 * a * c);

		if(delta >= 0.0){
			float t;
			if(a != 0.0){
				t = (-b - sqrt(delta))/(2.0 * a);
			}
			else{
				t = -c/b;
			}
			// Closer intersection
			if(t < hit.t && t > 0.0){
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			// To initialize the ray, we need to consider the position and direction
			r.pos = hit.position + 0.001*hit.normal; // a little off-set to avoid self-collision
			r.dir = normalize(reflect(-view, hit.normal));

			
			if ( IntersectRay( h, r ) ) {
				// Intersect reflection ray
				view = normalize(-r.dir);
				vec3 reflectionColor = Shade(h.mtl, h.position, h.normal, view);
				clr += k_s* reflectionColor;
				// Update next hit
				k_s *= h.mtl.k_s;
				hit = h;
				ray = r;
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;