package driver

import (
	"context"
	"sort"

	csi "github.com/container-storage-interface/spec/lib/go/csi"
	"github.com/osac-project/osac-csi-driver/pkg/fulfillment"
	"github.com/osac-project/osac-csi-driver/pkg/proxy"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"k8s.io/klog/v2"
)

// ControllerServer implements the CSI Controller service.
// It acts as a meta-driver, resolving storage tiers via the OSAC fulfillment
// service and proxying CSI calls to the appropriate vendor CSI driver.
type ControllerServer struct {
	csi.UnimplementedControllerServer
	fulfillment         fulfillment.Client
	proxyMgr            *proxy.Manager
	vendorSockets       map[string]string
	defaultVendorSocket string
}

// NewControllerServer creates a new CSI controller server.
func NewControllerServer(fc fulfillment.Client, proxyMgr *proxy.Manager, vendorSockets map[string]string) *ControllerServer {
	return &ControllerServer{
		fulfillment:         fc,
		proxyMgr:            proxyMgr,
		vendorSockets:       vendorSockets,
		defaultVendorSocket: firstSortedSocket(vendorSockets),
	}
}

// CreateVolume resolves the storage tier via the fulfillment service, then
// proxies the CreateVolume call to the appropriate vendor CSI driver.
func (c *ControllerServer) CreateVolume(ctx context.Context, req *csi.CreateVolumeRequest) (*csi.CreateVolumeResponse, error) {
	klog.Infof("CreateVolume called: name=%s", req.GetName())

	tier := req.GetParameters()["tier"]
	if tier == "" {
		return nil, status.Error(codes.InvalidArgument, "parameter 'tier' is required")
	}

	tenant := req.GetParameters()["tenant"]
	if tenant == "" {
		tenant = "default"
	}

	resolved, err := c.fulfillment.Resolve(ctx, tenant, tier)
	if err != nil {
		klog.Errorf("Failed to resolve tier %q: %v", tier, err)
		return nil, status.Errorf(codes.Internal, "failed to resolve storage tier %q: %v", tier, err)
	}
	klog.Infof("Resolved tier %q to backend %q at endpoint %q (protocol: %s)", tier, resolved.Backend, resolved.Endpoint, resolved.Protocol)

	vendorConn, err := c.proxyMgr.GetConnection(resolved.Endpoint)
	if err != nil {
		klog.Errorf("Failed to connect to vendor at %s: %v", resolved.Endpoint, err)
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewControllerClient(vendorConn)
	resp, err := vendorClient.CreateVolume(ctx, req)
	if err != nil {
		klog.Errorf("Vendor CreateVolume failed: %v", err)
		return nil, err
	}

	if resp.GetVolume() != nil {
		if resp.Volume.VolumeContext == nil {
			resp.Volume.VolumeContext = make(map[string]string)
		}
		resp.Volume.VolumeContext["osac.backend"] = resolved.Backend
		resp.Volume.VolumeContext["osac.volume-id"] = resp.Volume.VolumeId
		resp.Volume.VolumeContext["osac.protocol"] = resolved.Protocol
		klog.Infof("CreateVolume succeeded: volumeId=%s backend=%s", resp.Volume.VolumeId, resolved.Backend)
	}

	return resp, nil
}

// DeleteVolume proxies the DeleteVolume call to the vendor CSI driver.
// TODO: look up the volume's backend from inventory instead of using the default vendor socket.
func (c *ControllerServer) DeleteVolume(ctx context.Context, req *csi.DeleteVolumeRequest) (*csi.DeleteVolumeResponse, error) {
	klog.Infof("DeleteVolume called: volumeId=%s", req.GetVolumeId())

	socketPath := c.defaultVendorSocket
	if socketPath == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := c.proxyMgr.GetConnection(socketPath)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewControllerClient(vendorConn)
	resp, err := vendorClient.DeleteVolume(ctx, req)
	if err != nil {
		klog.Errorf("Vendor DeleteVolume failed: %v", err)
		return nil, err
	}

	klog.Infof("DeleteVolume succeeded: volumeId=%s", req.GetVolumeId())
	return resp, nil
}

// ControllerPublishVolume routes to the vendor based on volume_context.
func (c *ControllerServer) ControllerPublishVolume(ctx context.Context, req *csi.ControllerPublishVolumeRequest) (*csi.ControllerPublishVolumeResponse, error) {
	klog.Infof("ControllerPublishVolume called: volumeId=%s nodeId=%s", req.GetVolumeId(), req.GetNodeId())

	socketPath := c.resolveVendorSocket(req.GetVolumeContext())

	vendorConn, err := c.proxyMgr.GetConnection(socketPath)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewControllerClient(vendorConn)
	return vendorClient.ControllerPublishVolume(ctx, req)
}

// ControllerUnpublishVolume routes to the default vendor.
func (c *ControllerServer) ControllerUnpublishVolume(ctx context.Context, req *csi.ControllerUnpublishVolumeRequest) (*csi.ControllerUnpublishVolumeResponse, error) {
	klog.Infof("ControllerUnpublishVolume called: volumeId=%s nodeId=%s", req.GetVolumeId(), req.GetNodeId())

	if c.defaultVendorSocket == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := c.proxyMgr.GetConnection(c.defaultVendorSocket)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewControllerClient(vendorConn)
	return vendorClient.ControllerUnpublishVolume(ctx, req)
}

// ValidateVolumeCapabilities proxies the call to the default vendor CSI driver.
func (c *ControllerServer) ValidateVolumeCapabilities(ctx context.Context, req *csi.ValidateVolumeCapabilitiesRequest) (*csi.ValidateVolumeCapabilitiesResponse, error) {
	klog.Infof("ValidateVolumeCapabilities called: volumeId=%s", req.GetVolumeId())

	if c.defaultVendorSocket == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := c.proxyMgr.GetConnection(c.defaultVendorSocket)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewControllerClient(vendorConn)
	return vendorClient.ValidateVolumeCapabilities(ctx, req)
}

// ListVolumes proxies the call to the default vendor CSI driver.
func (c *ControllerServer) ListVolumes(ctx context.Context, req *csi.ListVolumesRequest) (*csi.ListVolumesResponse, error) {
	klog.Infof("ListVolumes called")

	if c.defaultVendorSocket == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := c.proxyMgr.GetConnection(c.defaultVendorSocket)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewControllerClient(vendorConn)
	return vendorClient.ListVolumes(ctx, req)
}

// ControllerGetCapabilities returns the capabilities supported by this controller.
func (c *ControllerServer) ControllerGetCapabilities(_ context.Context, _ *csi.ControllerGetCapabilitiesRequest) (*csi.ControllerGetCapabilitiesResponse, error) {
	klog.Infof("ControllerGetCapabilities called")
	return &csi.ControllerGetCapabilitiesResponse{
		Capabilities: []*csi.ControllerServiceCapability{
			{
				Type: &csi.ControllerServiceCapability_Rpc{
					Rpc: &csi.ControllerServiceCapability_RPC{
						Type: csi.ControllerServiceCapability_RPC_CREATE_DELETE_VOLUME,
					},
				},
			},
			{
				Type: &csi.ControllerServiceCapability_Rpc{
					Rpc: &csi.ControllerServiceCapability_RPC{
						Type: csi.ControllerServiceCapability_RPC_PUBLISH_UNPUBLISH_VOLUME,
					},
				},
			},
		},
	}, nil
}

func (c *ControllerServer) resolveVendorSocket(volumeContext map[string]string) string {
	if volumeContext != nil {
		if backend, ok := volumeContext["osac.backend"]; ok && backend != "" {
			if socketPath, ok := c.vendorSockets[backend]; ok {
				return socketPath
			}
		}
	}
	return c.defaultVendorSocket
}

// firstSortedSocket returns the socket path for the alphabetically first
// backend key. This provides deterministic default vendor selection.
func firstSortedSocket(vendorSockets map[string]string) string {
	if len(vendorSockets) == 0 {
		return ""
	}
	keys := make([]string, 0, len(vendorSockets))
	for k := range vendorSockets {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return vendorSockets[keys[0]]
}
